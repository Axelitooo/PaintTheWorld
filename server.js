//gestion serveur http
const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const kmeans = require('node-kmeans');
const supercluster = require('supercluster');
const bodyParser = require('body-parser');
var path = require('path');
const passport = require('passport');
const bcryptjs = require('bcryptjs');
const session = require('express-session');
const RDBStore = require('session-rethinkdb')(session);
const passportSocketIo = require("passport.socketio");
const app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const router = express.Router();


// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/chain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};


//On ouvre une connexion http sur le port 80 et https sur 443
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

//init socket.io EN LOCAL PASSER SUR httpServer !!!
var io = require('socket.io')(httpsServer);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//Redirection HTTP > HTTPS
var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
app.use(redirectToHTTPS());








//On se connecte � la BD 'test' sur notre serveur en local
const rdash = require('rethinkdbdash')({
    servers: [
        {host: 'localhost', port: 28015}
    ]
});
//init API ReQL
var r = require("rethinkdb");
var dbconn;
r.connect({host: 'localhost', port: 28015, db: 'test'})
        .then(conn => {
					console.log('Database connection initialized')
        	dbconn = conn;
});


/* passport */
const store = new RDBStore(rdash);

/* on config express */
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: 'paint-the-world', resave: true, store: store,
  saveUninitialized: false, cookie: {maxAge: 1000 * 60 * 15}}));


//On fourni au client (web) tous les fichiers dans le dossier "public"
//app.use(sslRedirect());
app.use(express.static('public', { dotfiles: 'allow' }));

/* Gestion des routes */

app.get('/concept', function(req, res){
				res.sendFile(path.join(__dirname, '/public/subpages/concept.html'))});

app.get('/drawings', function(req, res){
				res.sendFile(path.join(__dirname, '/public/subpages/localmap.html'))});

app.get('/signin', function(req, res){
		res.sendFile(path.join(__dirname, '/public/subpages/signin.html'))});

app.get('/login', function(req, res){
		res.sendFile(path.join(__dirname, '/public/subpages/login.html'))});

app.get('/success', function(req, res){
		res.send("Welcome in the community paint the world "+req.query.username+"!!!")});

app.get('/error', function(req, res){
		res.send("error")});






/*var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;


passport.use(new FacebookStrategy({
	  clientID: "531127074233558",
	  clientSecret: "9ee72e56592656c32131840d6932e92f",
	  callbackURL: "https://paint.antoine-rcbs.ovh/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
	  User.findOrCreate({ facebookId: profile.id }, function(err, user) {
	    if (err) { return done(err); }
	    done(null, user);
	  });
	 }
));

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
passport.authenticate('facebook', { failureRedirect: '/login' }),
function(req, res) {
 // Successful authentication, redirect home.
 res.redirect('/');
});*/



httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});






io.use(passportSocketIo.authorize({
	key: 'connect.sid',
	secret: 'paint-the-world',
	store: store,
	passport: passport,
	cookieParser: cookieParser,
	fail:         onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));
function onAuthorizeFail(data, message, error, accept){
		if(error) accept(new Error(message));
		console.log('failed connection to socket.io:', message);
		accept(null, false);
}


//Quand un client se connecte
io.on('connection', function(socket) {
  	//console.log('New connection !');
		//Quand ce client enverra un "new_drawing", on l'ajoute � la BD
    socket.on('new_drawing', function(data) {
				calculateMeanPos(data)
				//console.log(data);
        r.table('drawings').insert(data).run(dbconn, function(err, result) {
    			if (err) throw err;
    			//console.log(JSON.stringify(result, null, 2));
				});
		});
		socket.on('get_player_drawings', function() {
			if (socket.request.user && socket.request.user.logged_in) {
				var filt = r.row("player").eq(socket.request.user.username);
				sendDrawings(socket, filt, "player_drawings_loaded");
    	}

		});
		socket.on('get_random_drawing', function() {
			sendRandomDrawing(socket, 'random_drawing_loaded')
		});

		//Quand ce client enverra un changement de sa fenêtre d'affichage
		socket.on('bounds_changed',  function(bounds) {
			//On récupère les bounds (format leaflet) qu'il envoie
			var maxLat = bounds._northEast.lat;
			var minLat = bounds._southWest.lat;
			var maxLng = bounds._northEast.lng;
			var minLng = bounds._southWest.lng;
			var filt = r.row("lat").lt(maxLat).and(r.row("lat").gt(minLat).and(r.row("lng").lt(maxLng).and(r.row("lng").gt(minLng))));
			//On établit un flitre de requete ReQL pour garder les dessins dans sa zone affichée
			if (bounds.zoom < 15) {
				sendDrawingsClusters(socket, filt, bounds, "drawings_cluster_loaded");
			} else {
				//On envoie tous les dessins de la zone immédiatement à ce client
				sendDrawings(socket, filt, "drawings_loaded");
				if (socket.drawingsChangesCursor != null) { //Si le client écoute des changements sur zone
					//On essaye de fermer les requètes de changement en écoute en fond
					socket.drawingsChangesCursor.close().then(function () {
						//Si on parvient à virer la requete précédente, on lance une veille sur les changements dans la zone
						//console.log("cursor closed")
						scopeForChanges(socket, filt);
	    		})
	    		.catch(r.Error.ReqlDriverError, function (err) {
	        	console.log("An error occurred on cursor close");
	    		});
				} else { //Si pas encore de callback, on en lance un
					scopeForChanges(socket, filt);
				}
			}

		});
});


//Lance une détection de changement pour le socket donné avec un filtre donné
function scopeForChanges(socket, filt) {
	r.table('drawings').filter(filt).changes().run(dbconn, function(err, cursor) {
		socket.drawingsChangesCursor = cursor;
		cursor.each(function(err, item) {
			console.log("New drawing detected !");
			socket.emit("drawings_updated", item); //On notifie le client avec le changement
		});
	});
}

//Envoie les dessins en BDD correspondant à un filtre donné à ce socket
function sendDrawings(socket, filt, msg) {
	r.table('drawings').filter(filt).run(dbconn, function(err, cursor) {
		cursor.each(function(err, item) {
			socket.emit(msg, item); //Envoi de chaque dessin de la zone un par un
		});
	});
}

function sendRandomDrawing(socket, msg) {
	r.table('drawings').sample(1).run(dbconn, function(err, cursor) {
		cursor.each(function(err, item) {
			socket.emit(msg, item); //Envoi de chaque dessin de la zone un par un
		});
	});
}

//Envoie le nombre de dessins en BDD correspondant à un filtre donné à ce socket
function sendDrawingsClusters(socket, filt, bounds, msg) {
	r.table('drawings').pluck("lat", "lng").filter(filt).run(dbconn, function(err, cursor) {

		cursor.toArray(function (err, data) {
			let vectors = new Array();
			for (let i = 0 ; i < data.length ; i++) {
				vectors[i] = {"type": "Feature","geometry": {
						"type": "Point","coordinates": [data[i]['lat'], data[i]['lng']]
	  				}
				};
			}
			/*if (vectors.length >= 1) {
				let sc = Supercluster({radius: 40, maxZoom: 16}).load(vectors);
				let clusters = sc.getClusters([bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat], bounds.zoom);
				console.log(clusters);
				/*kmeans.clusterize(vectors, {k: ((vectors.length<6)?vectors.length:6)}, (err,res) => {
			  	if (err) console.error(err);
			  	else {
						res.forEach(res => {
							socket.emit(msg, {centroid : res.centroid, count : res.cluster.length})
						});
					}
				});
			}*/
		});

	});


}

/*Ajoute à un dessin des informations sur so milieu géométrique approximatif (barycentre)*/
function calculateMeanPos(drawing) {
	var lat = 0;
	var lng = 0;
	var count = 0;
	drawing.lines.forEach(line => {
		line.location.forEach(point => {
			lat+= point[0]
			lng+= point[1]
			count++
		});
	});
	drawing.lat = lat/count,
	drawing.lng = lng/count;
}




  passport.serializeUser(function(user, done) {
      done(null, user.id);
  });

  passport.deserializeUser(function(id, done){
			r.table('accounts').get(id).run(dbconn, function(err, user) {
					done(err, user)
			});
  });

  /* La fonction permettant e hash le mot de passe pour sécuriser la bdd */

  function generateHash(password){
      var salt = bcryptjs.genSaltSync(10);
      var hash = bcryptjs.hashSync(password, salt);
      return hash;
  };

  /* La fonction pour verifier la conformité des mots de passe
  celui du login et celui hasher qui est sur la bdd */

  function validPassword (password, passwordTyped){
      return bcryptjs.compareSync(passwordTyped, password);
  };


  /* Ici on gere l'insertion des données du formulaire
  vers la collection account de la bdd */
  app.post('/inscription', function(req,res){
      var name = req.body.name;
      var p_nom =req.body.p_nom;
      var email = req.body.email;
      var username = req.body.username;
      var pass0 = req.body.password1;
      var pass1 = req.body.password2;
      var regex = /^[a-zA-Z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$/;
      var strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
      if ((req.body.name && req.body.p_nom && req.body.email && req.body.username && req.body.password1 && req.body.password2)
          && (req.body.password1 == req.body.password2)
          && (regex.test(req.body.email))
          && (strongRegex.test(req.body.password1))
          && (req.body.password1.length >= 8)){

      		var data = {
          	"name": name,
          	"p_nom": p_nom,
          	"email": email,
          	"username": username,
          	"password": generateHash(pass1)
          }
					r.table('accounts').insert(data).run(dbconn, function(err, result) {
	    			if (err) throw err;
	    			console.log("Someone joined the community !!! ");
					});
		      res.redirect('/login')
      } else {
          res.send("Error. Please respect the seizure rules ! ");
      }



  })


  const LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy(
      function(username, password, done){
				r.table('accounts').filter({username: username}).run(dbconn, function(err, cursor) {
					cursor.each(function(err, user) {
              if(err){
                  return done(err);
              }
              if(!user){
                  return done(null, false);
              }
              if(!validPassword(user.password, password)){
                  return done(null, false);
              }
              return done(null, user);
					});
				});
      }
  ));
app.post('/login',
    passport.authenticate('local', { failureRedirect: '/error'}),
    function(req, res) {
			console.log('Connexion avec succès de ', req.body.username)
      //res.redirect('/success?username='+req.body.username);
			res.redirect('/')
    });

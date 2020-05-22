/* ------------ GESTION DES DEPENDANCES ----------------------*/
//Gestion du serveur express
const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');

//gestion des sessions et du login/logout
const session = require('express-session');
const passport = require('passport');
const bcryptjs = require('bcryptjs');
const RDBStore = require('session-rethinkdb')(session);
const passportSocketIo = require("passport.socketio");
const cookieParser = require('cookie-parser');

//SGBD/drivers
var r = require("rethinkdb");


/* ------------ INITIALISATION DU SERVEUR ----------------------*/
const app = express();
const router = express.Router();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

// Certificats pour HTTPS
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

//Redirection HTTP --> HTTPS
var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
app.use(redirectToHTTPS());

//init socket.io EN LOCAL PASSER SUR httpServer !!!
var io = require('socket.io')(httpsServer);

//Lance les deux serveurs
httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});
httpsServer.listen(443, () => {
console.log('HTTPS Server running on port 443');
});


/* ------------ INITIALISATION DRIVER RETHINKDB ----------------------*/
//Driver utilisé par la lib de session rethink...
const rdash = require('rethinkdbdash')({
    servers: [{host: 'localhost', port: 28015}]
});
//Driver officiel utilisé pour tout le reste
var dbconn;
r.connect({host: 'localhost', port: 28015, db: 'test'})
        .then(conn => {
					console.log('Database connection initialized')
					dbconn = conn;
					//On établi tous les services des dessins après une connexion réussie
        	require('./server/drawings_manager')(io, r, dbconn)
});

/* ------------ INITIALISATION PASSPORT ----------------------*/
const store = new RDBStore(rdash);
app.use(session({
  secret: 'paint-the-world', resave: false, store: store,
  saveUninitialized: false, cookie: {maxAge: 1000 * 60 * 15}}));
app.use(passport.initialize());
app.use(passport.session());
io.use(passportSocketIo.authorize({
	key: 'connect.sid',
	secret: 'paint-the-world',
	store: store,
	passport: passport,
	cookieParser: cookieParser,
	fail:         onAuthorizeFail
}));
function onAuthorizeFail(data, message, error, accept){
		if(error) accept(new Error(message));
		//console.log('failed connection to socket.io:', message);
		accept(null, false);
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
	r.table('accounts').get(id).run(dbconn, function(err, user) {
			done(err, user)
	});
});

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

//gestion du login
app.post('/login',
passport.authenticate('local', { failureRedirect: '/error'}),
function(req, res) {
	console.log('Connexion avec succès de ', req.body.username)
  console.log(req.user)
	res.redirect('/drawings')
});
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
				"permanant_paint_stock": 10,
				"temporary_paint_stock": 100,
      	"password": generateHash(pass1)
      }
			r.table('accounts').filter({username : username}).count().gt(0).run(dbconn, function (err, result) {
				if (!result) {
					r.table('accounts').insert(data).run(dbconn, function(err, result) {
	    			if (err) throw err;
	    			console.log("Someone joined the community !!! ");
					});
		      res.redirect('/login')
				} else {
					res.send("You've tried to register under an existant username !")
				}
			});

  } else {
      res.send("Error. Please respect the seizure rules ! ");
  }
})

/* ------------ INITIALISATION DES ROUTES ----------------------*/
require('./server/routes')(app);

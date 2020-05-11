//gestion serveur http
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http');
const https = require('https');
const kmeans = require('node-kmeans');


// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/chain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
app.use(redirectToHTTPS());


//On fourni au client (web) tous les fichiers dans le dossier "public"
//app.use(sslRedirect());
app.use(express.static('public', { dotfiles: 'allow' }));

//On ouvre une connexion http sur le port 80 et https sur 443
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

//init socket.io EN LOCAL PASSER SUR httpServer !!!
var io = require('socket.io')(httpsServer);

//init API ReQL
var r = require("rethinkdb");

//Connexion avec la BD
var dbconn;



//On se connecte � la BD 'test' sur notre serveur en local
r.connect({host: 'localhost', port: 28015, db: 'test'})
        .then(conn => {
        	dbconn = conn;
});


//Quand un client se connecte
io.on('connection', function(socket) {
  	//console.log('New connection !');
		//Quand ce client enverra un "new_drawing", on l'ajoute � la BD
    socket.on('new_drawing', function(data) {
				calculateMeanPos(data)
				console.log(data);
        r.table('drawings').insert(data).run(dbconn, function(err, result) {
    			if (err) throw err;
    			//console.log(JSON.stringify(result, null, 2));
				});
		});
		socket.on('get_player_drawings', function(player) {
			var filt = r.row("player").eq(player);
			sendDrawings(socket, filt, "player_drawings_loaded");
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
			if (Math.abs(maxLat-minLat)>0.02) {
				sendDrawingsClusters(socket, filt, "drawings_cluster_loaded");
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

//Envoie le nombre de dessins en BDD correspondant à un filtre donné à ce socket
function sendDrawingsClusters(socket, filt, msg) {

	r.table('drawings').pluck("lat", "lng").filter(filt).run(dbconn, function(err, cursor) {

		cursor.toArray(function (err, data) {
			let vectors = new Array();
			for (let i = 0 ; i < data.length ; i++) {
  			vectors[i] = [ data[i]['lat'] , data[i]['lng']];
			}
			if (vectors.length >= 1) {
				kmeans.clusterize(vectors, {k: ((vectors.length<6)?vectors.length:6)}, (err,res) => {
			  	if (err) console.error(err);
			  	else {
						res.forEach(res => {
							socket.emit(msg, {centroid : res.centroid, count : res.cluster.length})
						});
					}
				});
			}
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

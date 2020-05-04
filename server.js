//gestion serveur http
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http');
const https = require('https');


// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/paint.antoine-rcbs.ovh/chain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};


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



//On se connecte à la BD 'test' sur notre serveur en local
r.connect({host: 'localhost', port: 28015, db: 'test'})
        .then(conn => {
        	dbconn = conn;
		scopeForChanges();
});


//Dès qu'un changement intervient sur les points, on envoie la modification à tout le monde.
function scopeForChanges() {
	r.table('drawings').changes().run(dbconn, function(err, cursor) {
		cursor.each(function(err, item) {
			console.log("New drawing detected !");
			io.emit("drawings_updated", item); //On envoie à tout le monde
		});
	});


}


//Quand un client se connecte
io.on('connection', function(socket) {
  	console.log('New connection !');
	//On envoie tous les dessins de la carte à ce client
	r.table('drawings').run(dbconn, function(err, cursor) {
			cursor.each(function(err, item) {
			socket.emit("drawings_loaded", item); //On n'envoie qu'à ce client
		});
	});


    //Quand ce client enverra un "new_drawing", on l'ajoute à la BD
    socket.on('new_drawing', function(data) {
	console.log(data);
        r.table('drawings').insert(data).run(dbconn, function(err, result) {
    			if (err) throw err;
    			//console.log(JSON.stringify(result, null, 2));
		});

	});


});




//gestion serveur http
var express = require('express');
var app = express();
var http = require('http').createServer(app);

//init socket.io
var io = require('socket.io')(http);

//init API ReQL
var r = require("rethinkdb");

//Connexion avec la BD
var dbconn;



//On fourni au client (web) tous les fichiers dans le dossier "public"
app.use(express.static('public'));

//On ouvre une connexion http sur le port 8000
http.listen(8000, function(){
	  console.log('listening on *:8000');
});



//On se connecte à la BD 'test' sur notre serveur en local
r.connect({host: 'localhost', port: 28015, db: 'test'})
        .then(conn => {
        	dbconn = conn;
		scopeForChanges();
});


//Dès qu'un changement intervient sur les points, on envoie la modification à tout le monde.
function scopeForChanges() {
	r.table('points').changes().run(dbconn, function(err, cursor) {
		cursor.each(function(err, item) {
			console.log("New point detected !");
			io.emit("points_updated", item); //On envoie à tout le monde
		});
	});
}


//Quand un client se connecte
io.on('connection', function(socket) { 
  	console.log('New connection !');
	//On envoie tous les points de la carte à ce client
	r.table('points').run(dbconn, function(err, cursor) {
			cursor.each(function(err, item) {
			socket.emit("points_loaded", item); //On n'envoie qu'à ce client
		});
	});
	//Quand ce client enverra un "new_point", on l'ajoute à la BD
	socket.on('new_point', function(data) {
		console.log(data.location);
		r.table('points').insert({"color": "#FF54EF", "location": data.location}).run(dbconn, function(err, result) {
    			if (err) throw err;
    			//console.log(JSON.stringify(result, null, 2));
		});
	});
});




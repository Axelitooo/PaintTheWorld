var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var r = require("rethinkdb");


app.use(express.static('public'));

//Quand un client se connecte, on lui envoie tous les points de la carte
io.on('connection', function(socket){ 
	console.log('a user connected');
	r.connect({db: 'test'}).then(function(conn) {
		r.table('points').run(conn, function(err, cursor) {
			cursor.each(function(err, item) {
				socket.emit("points_loaded", item); //On n'envoie qu'à ce client
			});
		});
	});
});

http.listen(8000, function(){
	  console.log('listening on *:8000');
});

//Dès qu'un changement intervient sur les points, on envoie la modification à tout le monde.
r.connect({db: 'test'}).then(function(conn) {
	r.table('points').changes().run(conn, function(err, cursor) {
		cursor.each(function(err, item) {
			io.emit("points_updated", item); //On envoie à tout le monde
		});
	});
});

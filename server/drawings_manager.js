module.exports = function(io, r, dbconn) {
  const supercluster = require('supercluster');
  //Quand un client se connecte
  io.on('connection', function(socket) {
    	//console.log('New connection !');
  		//Quand ce client enverra un "new_drawing", on l'ajoute � la BD
      socket.on('new_drawing', function(data) {
  				calculateMeanPos(data)
          //data.datetime = new Date();
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
  			sendRandomDrawing(socket, 'random_drawing_loaded');
  		});

  		socket.on('check_username_existant', function(username) {
  			sendIfUsernameExistant(socket, username, 'is_username_existant');
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
  			if (bounds.zoom < 16) {
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
  						"type": "Point","coordinates": [data[i]['lat'], data[i]['lng']],
  					}, "properties":null
  				};
  			}
  			if (vectors.length > 1) {
  				let sc = new supercluster({radius: 40, maxZoom: 16});
  				sc.load(vectors);
  				let clusters = sc.getClusters([-180,-90, 180, 90], bounds.zoom);
  				clusters.forEach(cluster => {
  					if (cluster.properties == null) cluster.properties = {point_count: 1};
  					socket.emit(msg, {centroid : cluster.geometry.coordinates, count : cluster.properties.point_count})
  				});
  			} else if (vectors.length == 1) {
  				socket.emit(msg, {centroid : [data[0].lat, data[0].lng], count : 1})
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

  function sendIfUsernameExistant(socket, username, msg) {
    r.table('accounts').filter({username : username}).count().gt(0).run(dbconn, function (err, result) {
  		socket.emit(msg, result);
  	});
  }

  //Incrémente de 1L les stocks de peinture temporaire de tous les joueurs toutes les 2 minutes
  setInterval(function(){
  	r.table("accounts").update({
  	    temporary_paint_stock: r.row("temporary_paint_stock").add(1)
  	}).run(dbconn);
  }, 120000);

}

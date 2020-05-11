//initialise la carte en vue en échelle france centrée sur lyon
var mymap = L.map('gamemap').setView([45.785, 4.8778], 6);

//Initialise le socket
var socket = io();


//Osef puissance 3000 verbeux : charge juste une carte en fond avec une clef d'API
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery  <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYW50b2luZXJjYnMiLCJhIjoiY2s2Nm5hdzh2MTExOTNtbXBsbG1qbjc1NSJ9.lyYYPYUi6_L9nsdvNcRudw'
}).addTo(mymap);

var markerLayer = L.layerGroup().addTo(mymap);


//On demande la localisation du client et on centre/zoom sur sa position
mymap.locate({setView: true, maxZoom: 18});
//A chaque changement (déplacement et changement de zoom) on lance onMapBoundsChange
mymap.on('moveend', onMapBoundsChange);
mymap.on('zoomend', onMapBoundsChange);

//A chaque changement de zone,
function onMapBoundsChange(e) {
  clearMap();
  socket.emit('bounds_changed',mymap.getBounds());
}

function getPlayerDrawings(player) {
  socket.emit('get_player_drawings', player);
}

//Quand des dessins existants sont chargés on les ajoute
socket.on('drawings_loaded', function(item) {
	addDrawingToMap(item);
});

//Quand des dessins existants sont chargés on les ajoute
socket.on('drawings_cluster_loaded', function(item) {
  addDrawingClustersToMap(item.centroid, item.count)
});

//Quand un nouveau dessin apparait, on l'ajoute
socket.on('drawings_updated', function(item) {
	addDrawingToMap(item.new_val);
});

function addDrawingClustersToMap(centroid, count) {
  L.marker(centroid, {
  icon: L.divIcon({
      className: 'unzoomed-map-marker',
      html: count
    })
  }).addTo(markerLayer);
}

//Dessine un dessin en entier
function addDrawingToMap(drawing) {
  var popupContent = "Dessiné par : <b>" + drawing.player + "</b></br> Date :" + drawing.datetime;
	drawing.lines.forEach(function(line) {
		addLineToMap(line.color, line.thickness, line.location).bindPopup(popupContent);
	});
}

//Dessine une ligne
function addLineToMap(color, thickness, locations) {
 	var c = rgbToHex(color);
	var w = Math.round(thickness*mymap.getZoomScale(mymap.getZoom(), 20));
 	return L.polyline(locations, {color: c, weight: w}).addTo(mymap);
}


//Néttoie la carte de tous ses dessins
function clearMap() {
    markerLayer.clearLayers()
    for(i in mymap._layers) {
        if(mymap._layers[i]._path != undefined) {
            try {
                mymap.removeLayer(mymap._layers[i]);
            }
            catch(e) {
                console.log("problem with " + e + mymap._layers[i]);
            }
        }
    }
}

//Convertie une couleur au format RGBA (int) en un string accepté par leaflet en hexa (eg "#FFFFFF")
function rgbToHex (rgb) {
  var hex = rgb.toString(16);
  while (hex.length < 6) {
       hex = "0" + hex;
  }
  return "#"+hex;
};

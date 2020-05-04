//initialise la carte
var mymap = L.map('gamemap').setView([45.785, 4.8778], 15);

//Initialise le socket
var socket = io();

var drawings = [];


//Osef puissance 3000 verbeux : charge juste une carte en fond avec une clef d'API
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery  <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYW50b2luZXJjYnMiLCJhIjoiY2s2Nm5hdzh2MTExOTNtbXBsbG1qbjc1NSJ9.lyYYPYUi6_L9nsdvNcRudw'
}).addTo(mymap);


function addLineToMap(color, thickness, locations) {
 	var c = rgbToHex(color);
	console.log(mymap.getZoom());
	var w = thickness*15/20;
 	return L.polyline(locations, {color: c, weight: w}).addTo(mymap);
}

function addDrawingToMap(drawing) {
  var lines = [];
	drawing.lines.forEach(function(line) {
		lines.push(addLineToMap(line.color, line.thickness, line.location).bindPopup(drawing.player));
	});
  return lines;
}

/*mymap.on('zoom', function (ev) {
  for (var i = 0; i < drawings.length; i++) {
    for (var j = 0; j < drawings[i].length; j++) {
      console.log(drawings[i][j].options.weight*mymap.getZoom()/20.0)
        drawings[i][j].setStyle({weight : drawings[i][j].options.weight*mymap.getZoom()/20.0})
    }
  }
});*/

function rgbToHex (rgb) {
  var hex = rgb.toString(16);
  while (hex.length < 6) {
       hex = "0" + hex;
  }
  return "#"+hex;
};

//ajoute le point � la carte lorsqu'on a une maj
socket.on('drawings_loaded', function(item) {
	drawings.push(addDrawingToMap(item));
});

socket.on('drawings_updated', function(item) {
	drawings.push(addDrawingToMap(item.new_val));
});

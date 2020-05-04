//initialise la carte
var mymap = L.map('gamemap').setView([45.785, 4.8778], 15);

//Initialise le socket
var socket = io();


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
	var w = thickness/* * mymap.getZoom()*0.025*/;
 	return L.polyline(locations, {color: c, weight: w}).addTo(mymap);
}

function addDrawingToMap(drawing) {
	drawing.lines.forEach(function(line) {
		addLineToMap(line.color, line.thickness, line.location).bindPopup(drawing.player);
	});
}

function rgbToHex (rgb) { 
  var hex = rgb.toString(16);
  while (hex.length < 6) {
       hex = "0" + hex;
  }
  return "#"+hex;
};

//ajoute le point à la carte lorsqu'on a une maj
socket.on('drawings_loaded', function(item) {
	addDrawingToMap(item);
});

socket.on('drawings_updated', function(item) {
	addDrawingToMap(item.new_val);
});




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

//Fonction ajoutant un point à la carte avec cette couleur et ces positions latitude/longitude
function addPointToMap(color, location) {
	L.circle(location, {
        	color: color,
        	fillColor: color,
        	fillOpacity: 0.75,
        	radius: 40,
	}).addTo(mymap);
}

//ajoute le point à la carte lorsqu'on a une maj
socket.on('points_updated', function(item) {
	addPointToMap(item.new_val.color, item.new_val.location);
});

//ajoute un point à la carte lors d'un chargement initial
socket.on('points_loaded', function(item) {
	addPointToMap(item.color, item.location);
});


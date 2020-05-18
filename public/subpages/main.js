// Random

var random = document.createElement("button");
random.innerHTML = "Random !";
random.setAttribute("style", "background-image: url(stains/6.jpg); background-position: center; background-repeat: no-repeat; background-size: calc(10px + 1.6vh + 0.9vw);");
document.getElementById("menu").appendChild(random);

random.onclick = function () {
	socket.emit('get_random_drawing');
}

socket.on('random_drawing_loaded', function(drawing) {
	mymap.setView([drawing.lat, drawing.lng], 19);
})

// Center

function add(buttonNumber, drawing) {
	var div = document.createElement("div");
	var drawingDiv = document.createElement("div");
	var button = document.createElement("button");
	button.setAttribute("style", "background-image: url(stains/" + getRandomInt(5) + ".jpg); background-position: center; background-repeat: no-repeat; background-size: calc(20px + 3.2vh + 1.8vw);");
	button.innerHTML = "Drawing " + buttonNumber;
	div.appendChild(button);

	div.appendChild(drawingDiv);
	var draw = SVG().addTo(drawingDiv).size(300, 300)
	convertLinesToAbsolute(drawing)
	drawing.lines.forEach(line => {
		var polyline = draw.polyline(line.location)
		polyline.fill('none')
		polyline.stroke({color : rgbToHex(line.color), width: 4, linecap: 'round', linejoin: 'round' })
	});

	document.getElementById("menu").appendChild(div);
	button.onclick = function () {
		mymap.setView([drawing.lat, drawing.lng], 19);
	}
}
function convertLinesToAbsolute(drawing) {
	var minX = 3000, minY = 3000;
	drawing.lines.forEach(line => {
		line.location.forEach(loc => {
			if (loc[0]< minX) minX = loc[0]
			if (loc[1]< minY) minY = loc[1]
		});
	});
	drawing.lines.forEach(line => {
		line.location.forEach((loc, i) => {
			line.location[i] = [(loc[1]-minY)*100000,(loc[0]-minX)*100000]
		});
	});

}

// Drawings

getPlayerDrawings("RootUser42");
var inc = 1;
socket.on('player_drawings_loaded', function(drawing) {
	add(inc++, drawing);
});

function getRandomInt(max) {
	return 1 + Math.floor(Math.random() * Math.floor(max));
}
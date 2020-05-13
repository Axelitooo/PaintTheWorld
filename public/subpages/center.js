function add(buttonNumber, drawing) {
	var button = document.createElement("button");
	button.innerHTML = "Drawing " + buttonNumber;
	document.getElementById("menu").appendChild(button);
	button.onclick = function () {
		mymap.setView([drawing.lat, drawing.lng], 19);
	}
}
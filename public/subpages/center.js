function add(buttonNumber, drawing) {
	var button = document.createElement("BUTTON");
	button.innerHTML = "I am button " + buttonNumber;
	document.getElementById("menu").appendChild(button);
	button.onclick = function () {
		mymap.setView([drawing.lat, drawing.lng], 19);
	}
}

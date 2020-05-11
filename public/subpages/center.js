function add(buttonNumber, drawing) {
	var element = document.createElement("span");
	var button = document.createElement("button");
	button.innerHTML = "Drawing " + buttonNumber;
	element.appendChild(button);
	document.getElementById("nav").appendChild(element);
	button.onclick = function () {
		mymap.setView([drawing.lat, drawing.lng], 19);
	}
}

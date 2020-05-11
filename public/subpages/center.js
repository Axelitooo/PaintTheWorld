function add(buttonNumber, drawing) {
	var element = document.createElement("LI");
	var button = document.createElement("BUTTON");
	button.innerHTML = "I am button " + buttonNumber;
	element.appendChild(button);
	document.getElementById("list").appendChild(element);
	button.onclick = function () {
		mymap.setView([drawing.lat, drawing.lng], 19);
	}
}

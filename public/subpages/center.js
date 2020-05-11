function add(button, buttonNumber, drawing) {
	var button = document.createElement("BUTTON");
	button.innerHTML = "I am button &{buttonNumber}";
	getElementById("menu").appendChild(button);
	button.onclick = centerOnDrawing(); // Note this is a function
	
function centerOnDrawing() {
	mymap.setView([drawing.lat, drawing.lng], 19);
}
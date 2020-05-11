getPlayerDrawings("RootUser42");
var inc = 0
socket.on('player_drawings_loaded', function(drawing) {
	add(inc++, drawing);
});

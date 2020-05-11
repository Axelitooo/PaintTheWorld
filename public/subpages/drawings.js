getPlayerDrawings("RootUser42");
var inc = 1;
socket.on('player_drawings_loaded', function(drawing) {
	add(inc++, drawing);
});

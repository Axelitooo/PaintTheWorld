get_player_drawings(RootUser42);

socket.on('player_drawings_loaded', function(drawing) {
	add(button, 1, drawing);
});
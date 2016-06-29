var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var async = require("async");

var request = require("request");
var uuid = require('uuid');

var cheerio = require('cheerio');

var words = require("./server/words.js");

eval(fs.readFileSync('./server/Game.js')+'');

var game = new Game();

game.start();

io.on('connection', function(socket){
	game.addPlayer(socket);

	socket.on('guess', function(word){
		game.suggestion(socket, word);
	});

	socket.on('pseudo', function(pseudo){
		game.pseudo(socket, pseudo);
	});

	socket.on('disconnect', function(){
		game.removePlayer(socket);
	});
});

app.use(express.static("public"));

http.listen(3000, function(){

});
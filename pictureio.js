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

var noAccent = function(str){
	var accent = [
	/[\300-\306]/g, /[\340-\346]/g,
	/[\310-\313]/g, /[\350-\353]/g, 
	/[\314-\317]/g, /[\354-\357]/g, 
	/[\322-\330]/g, /[\362-\370]/g, 
	/[\331-\334]/g, /[\371-\374]/g, 
	/[\321]/g, /[\361]/g, 
	/[\307]/g, /[\347]/g, 
	];
	var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
	for(var i = 0; i < accent.length; i++){
		str = str.replace(accent[i], noaccent[i]);
	}
	return str;
}

eval(fs.readFileSync('./server/Game.js')+'');

var game = new Game();

game.start();


io.on('connection', function(socket){
	game.addPlayer(socket);

	socket.on('guess', function(word){
		game.suggestion(socket, word);
	});

	socket.on('disconnect', function(){
		game.removePlayer(socket);
	});
});

app.use(express.static("public"));

http.listen(3000, function(){

});
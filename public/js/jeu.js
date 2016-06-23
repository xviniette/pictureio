var client;
var isServer = false;
var socket;

$(function(){
	client = new Client();
    socket = io();

    socket.on("you", function(data){
    	console.log(data);
    });

    socket.on("players", function(data){
    	console.log(data);
    });

});


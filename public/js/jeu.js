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
        vues.app.setPlayers(data);
    });

    socket.on("newPlayer", function(data){
        vues.app.newPlayer(data);
    });

    socket.on("removePlayer", function(data){
        vues.app.removePlayer(data);
    });

    socket.on("guess", function(data){
        console.log(data);
        if(data.valid){
            console.log("VALIDE");
        }else{
            console.log("INVALIDE");
        }
    });

    socket.on("newRound", function(data){
        $("#img").attr("src", data.img);
    })


    socket.on("playerGuess", function(data){
        vues.app.addRankingPlayer(data);
    });

});


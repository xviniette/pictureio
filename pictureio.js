var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var async = require("async");

var request = require("request");
var uuid = require('uuid');

var cheerio = require('cheerio');

var words = require("./server/words.js");


String.prototype.noAccent = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
        ];
        var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
        var str = this;
        for(var i = 0; i < accent.length; i++){
            str = str.replace(accent[i], noaccent[i]);
        }
        return str;
    }

    var getTraductions = function(word, target, callback){
       var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl="+target+"&dt=t&q="+word;

       request({
          method:"GET",
          url:url
      }, function(err, reponse, body){
          if(err){
             callback();
         }else{
             var value = body.split('"')[1].noAccent();
             callback(value);
         }
     });

   }

   var getRandomPicture = function(word, callback){
    var url = "http://www.bing.com/images/async?q="+word+"&async=content&first=0&count=10&dgst=ro_u892*&IID=images.1&SFX=2&IG=D94A4836D0054273A224A088DB6C8F4D&CW=990&CH=972&CT=1466756991818&qft=+filterui:imagesize-medium&form=R5IR2";

    request({
        method:"GET",
        url:url
    }, function(err, reponse, body){
        if(err){
            callback();
        }else{
            console.log(body);
            callback(value);
        }
    });
}

var getRandomWord = function(cb){
	var word = words[Math.floor(Math.random() * words.length)];

	var langList = ["fr", "ca"];

    currentWord = [];

    async.forEachOf(langList, function(value, key, callback){
        getTraductions(word, value, function(data){
            if(data != null){
                currentWord.push(data);
            }
            callback();
        });
    }, function(err){
        currentWord.push(word);
        cb(word);
    });
}

getRandomWord(function(word){
    console.log(word);
    console.log(currentWord);
    getRandomPicture(word, function(){

    });
})


var goodGuess = function(guess){
	for(var i in currentWord){
		if(currentWord[i] == guess.noAccent()){
			return true;
		}
	}	
	return false;
}

var currentWord = [];
var startTime = 0;

var players = {};
var ranking = [];


io.on('connection', function(socket){

	players[socket.id] = {
		id:uuid.v1(),
		pseudo:"Player-"+Math.floor(Math.random()*1000),
		times:[],
		ranks:[],
        lastGuess:0
    }

    socket.emit("you", players[socket.id]);
    socket.emit("players",  Object.keys(players).map(function (key) {return players[key]}));
    io.emit("newPlayer", players[socket.id]);


    socket.on("pseudo", function(pseudo){
      if(pseudo.length > 0){
         players[socket.id].pseudo = pseudo;
         io.emit("pseudo", {id:players[socket.id].id, pseudo:players[socket.id].pseudo});
     }
 });

    socket.on('guess', function(word){
        var p = players[socket.id];
        if(Date.now() - p.lastGuess > 500){
            p.lastGuess = Date.now();
            if(goodGuess(word)){
                ranking.push(p);
                var time = Date.now() - startTime;
                p.times.push(time);
                p.ranks.push(ranking.length);

                socket.emit("guess", {valid:true, word:word, position:ranking.length, time:time});
                io.emit("playerGuess", {players:p, position:ranking.length, time:time});
            }else{
                socket.emit("guess", {valid:false, word:word});
            }
        }else{
            socket.emit("toofast");
        }

    });

    socket.on('disconnect', function(){
      io.emit("removePlayer", players[socket.id]);
      delete players[socket.id];
  });
});

app.use(express.static("public"));

http.listen(3000, function(){

});
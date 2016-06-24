var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var async = require("async");

var request = require("request");
var uuid = require('uuid');

var cheerio = require('cheerio');

var words = require("./server/words.js");

var startTime = 0;

var currentWord = [];

var players = {};
var ranking = [];


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
         var value = body.split('"')[1].noAccent().toUpperCase();
         callback(value);
       }
     });

     }

     var getRandomPicture = function(word, callback){
      var url = "https://www.google.fr/search?q="+word+"&tbm=isch&ijn=1";
      request({
        method:"GET",
        url:url
      }, function(err, reponse, body){
        if(err){
          callback();
        }else{
          $ = cheerio.load(body);
          var images = $(".rg_l");
          var urls = [];
          for(var i in images){
            if(images[i].attribs && images[i].attribs.href && images[i].attribs.href.split("imgurl=")[1] && images[i].attribs.href.split("imgurl=")[1].split("&")[0]){
              urls.push(images[i].attribs.href.split("imgurl=")[1].split("&")[0]);
            }
          }
          callback(urls[Math.floor(Math.random() * urls.length)]);
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
      currentWord.push(word.noAccent().toUpperCase());
      cb(word);
    });
   }

   var goodGuess = function(guess){
     for(var i in currentWord){
      if(currentWord[i] == guess.noAccent().toUpperCase()){
       return true;
     }
   }	
   return false;
 }

 var newRound = function(){
  getRandomWord(function(word){
    for(var i in players){
      players[i].hasFound = false;
    }
    startTime = Date.now();
    ranking = [];
    getRandomPicture(word, function(url){
      io.emit("newRound", {words:currentWord, img:url});
    });
    
  });
}


setInterval(function(){
  newRound();
}, 10 * 1000);

newRound();




io.on('connection', function(socket){

	players[socket.id] = {
		id:uuid.v1(),
		pseudo:"Player-"+Math.floor(Math.random()*10000),
		times:[],
		ranks:[],
    lastGuess:0,
    hasFound:false
  }

  socket.emit("you", players[socket.id]);
  socket.emit("players",  Object.keys(players).map(function (key) {return players[key]}));
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("pseudo", function(pseudo){
    if(pseudo.length > 0){
     players[socket.id].pseudo = pseudo;
     io.emit("pseudo", {id:players[socket.id].id, pseudo:players[socket.id].pseudo});
   }
 });

  socket.on('guess', function(word){
    var p = players[socket.id];
    if(p.hasFound){
      socket.emit("alreadyFound");
      return;
    }
    if(Date.now() - p.lastGuess > 500){
      p.lastGuess = Date.now();
      if(goodGuess(word)){
        ranking.push(p);
        var time = Date.now() - startTime;
        p.times.push(time);
        p.ranks.push(ranking.length);

        socket.emit("guess", {valid:true, word:word, position:ranking.length, time:time});
        p.hasFound = true;
        io.emit("playerGuess", {player:p, position:ranking.length, time:time});
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
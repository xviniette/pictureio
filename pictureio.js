var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = {};


io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('guess', function(msg){
    console.log('message: ' + msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

app.use(express.static("public"));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
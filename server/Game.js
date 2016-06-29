var Game = function(){
	this.players = {};
	this.nextPosition = 1;

	this.currentWords = [];
	this.picture = null;

	this.startTime = 0;
	this.roundTime = 30 * 1000;

	this.languages = ["fr"];
}

Game.prototype.start = function(){
	var _this = this;

	this.currentWords = [];
	this.nextPosition = 1;

	for(var i in this.players){
		this.players[i].hasFound = false;
	}

	this.getRandomWord(function(word, words){
		_this.currentWords = words;
		_this.getRandomPicture(word, function(img){
			_this.picture = img;
			_this.startTime = Date.now();
			io.emit("newGame", {timeleft:_this.roundTime, img:_this.picture, words:_this.currentWords});
		});
	});

	setTimeout(function(){
		_this.start();
	}, this.roundTime);
}


Game.prototype.getRandomPicture = function(word, callback){
	var url = "https://www.google.fr/search?q="+word+"&tbm=isch&ijn=1&tbs=isz:m";
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

Game.prototype.getTraductions = function(word, target, callback){
	var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl="+target+"&dt=t&q="+word;
	request({
		method:"GET",
		url:url
	}, function(err, reponse, body){
		if(err){
			callback();
		}else{
			callback(body.split('"')[1]);
		}
	});
}

Game.prototype.getRandomWord = function(cb){
	var word = words[Math.floor(Math.random() * words.length)];
	var allWords = [];
	var _this = this;

	async.forEachOf(this.languages, function(value, key, callback){
		_this.getTraductions(word, value, function(data){
			if(data != null){
				allWords.push({
					language:value,
					word:data,
					clean:_this.noAccent(data).toUpperCase()
				});
			}
			callback();
		});
	}, function(err){
		allWords.push({
			language:"en",
			word:word,
			clean:_this.noAccent(word).toUpperCase()
		});
		cb(word, allWords);
	});
}

Game.prototype.goodSuggestion = function(word){
	for(var i in this.currentWords){
		var splitWord = this.currentWords[i].clean.split(" ");
		var splitGuess = word.split(" ");
		for(var w of splitWord){
			for(var g of splitGuess){
				if(w == this.noAccent(g).toUpperCase()){
					return this.currentWords[i];
				}
			}
		}
	}	
	return false;
}

Game.prototype.suggestion = function(socket, word){
	var p = this.players[socket.id];
	if(p.hasFound){
		socket.emit("alreadyFound");
		return;
	}
	if(Date.now() - p.lastGuess > 500){
		p.lastGuess = Date.now();

		var isGood = this.goodSuggestion(word);
		if(isGood){
			var time = Date.now() - this.startTime;
			p.times.push(time);
			p.ranks.push(this.nextPosition);

			socket.emit("guess", {valid:true, word:isGood, position:this.nextPosition, time:time});
			io.emit("playerGuess", {player:p, position:this.nextPosition, time:time});
			p.hasFound = true;
			this.nextPosition++;
		}else{
			socket.emit("guess", {valid:false, word:word});
		}
	}else{
		socket.emit("toofast");
	}
}	

Game.prototype.addPlayer = function(socket){
	this.players[socket.id] = {
		id:uuid.v1(),
		pseudo:"Player-"+Math.floor(Math.random()*10000),
		times:[],
		ranks:[],
		lastGuess:0,
		hasFound:false
	};

	socket.emit("you", this.players[socket.id]);
	socket.emit("players", this.getPlayers());
	socket.broadcast.emit("newPlayer", this.players[socket.id]);
}

Game.prototype.removePlayer = function(socket){
	io.emit("removePlayer", {id:this.players[socket.id].id});
	delete this.players[socket.id];
}

Game.prototype.getPlayers = function(){
	var _this = this;
	return Object.keys(_this.players).map(function (key) {return _this.players[key]})
}

Game.prototype.pseudo = function(socket, pseudo){
	if(pseudo.length > 0){
		this.players[socket.id].pseudo = pseudo;
		io.emit("pseudo", {id:this.players[socket.id].id, pseudo:pseudo});
	}
}

Game.prototype.noAccent = function(str){
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



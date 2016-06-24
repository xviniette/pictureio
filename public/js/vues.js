var vues = {};

$(function(){
    vues.app = new Vue({
        el:"#app",
        data:{
            proposal:"",
            players:[],
            ranking:[],
        },
        methods:{
            propose:function(){
                if(this.proposal.length > 0){
                    socket.emit("guess", this.proposal);
                    this.proposal = ""; 
                }
            },
            setPlayers: function(players){
                this.players = players;
            },
            newPlayer:function(player){
                this.players.push(player);
                // this.players[player.id] = player;
            },
            removePlayer:function(player){
                for(var i in this.players){
                    if(this.players[i].id == player.id){
                        this.players.splice(i, 1);
                    }
                }
            },
            initRanking:function(){
                this.ranking = [];
            },
            addRankingPlayer:function(rank){
                this.ranking.push(rank);
            }
        }
    });
});
// app.js THIS IS THE SERVER
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var engine = require('./public/javascripts/simpleGame_1_0.js');
var cpu = require('windows-cpu');

var playerList = [];
var playerPOS = {};
var playerUpdates = [];

app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

setInterval(function() {
    // Get total load on server for each CPU
    cpu.totalLoad(function(error, results) {
        if(error) {
            return console.log(error);
        }
        console.log(results);
    });
}, 5000);

function initPlayers(player, cid) {
    var t_player = new engine.Sprite(player.width, player.height, player.cHeight, player.cWidth, player.x, player.y, player.dx, player.dy, player.imgAngle, player.moveAngle, player.speed);
    playerPOS['"'+cid+'"'] = t_player;
}

function updatePlayers(clientID) {
    for (var property in playerPOS) {
        playerPOS[property].update();
    }
    io.to(clientID).emit('Updates', playerPOS);
}

io.on('connection', function(client) {
    console.log('Client connected...');
    playerList.push(client.id);


    client.on('disconnect', function(){
        console.log('Client disconnected');
        var index = playerList.indexOf(client.id);
        playerList.splice(index, 1);
    });

    client.on('join', function() {
        //client.send(client.id);
        console.log('ClientID: ' + client.id);
        client.emit('assignID', client.id);
    });

    client.on('PlayerInfo', function(playerObject) {
        var obj = playerObject;
        initPlayers(obj, client.id);
    });

    client.on('getInfo', function() {
        updatePlayers(client.id);
    })

    client.on('pinging', function() {
        client.emit('pongong');
    });

});



server.listen(4200);







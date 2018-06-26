
/**
 * Joshua Sutton
 */

var socket = io.connect('multi-box:4200');
var userID;

socket.on('connect', function() {
    socket.emit('join');
    socket.on('assignID', function(data) {
        userID = data;
        alert(data);
    })
});

//Used to calculate latency between client and server.
var ppStartTime;
var latencyAvg = [];
function getAvgLat() {
    var sum = 0;
    if (latencyAvg.length > 20) {
        latencyAvg.splice(Math.max(latencyAvg.length - 5, 1));
    }
    for( var i = 0; i < latencyAvg.length; i++ ){
        sum += parseInt( latencyAvg[i], 10 ); //don't forget to add the base
    }
    var avg = sum / latencyAvg.length;
    return avg;
}
setInterval(function() {
    ppStartTime = Date.now();
    socket.emit('pinging');
}, 2000);
socket.on('pongong', function() {
    var latency = Date.now() - ppStartTime;
    latencyAvg.push(latency);
    $('#Ping').html(getAvgLat());
});

var scene;
var player;
var crosshair;
var projectiles;
var timer;
var gameTimer;
var healthbar;
var onlinePlayers = [];
var whileLoopList = [];
var forLoopList = [];

/* ------- SCREEN SIZE ------- */
var GRID_SIZE = 32;
var MAX_WIDTH = window.screen.width;
var MAX_HEIGHT = window.screen.height;
var COLUMNS = 60;
var ROWS = 33.75;
var xSCALE = (MAX_WIDTH / COLUMNS) / GRID_SIZE;
var ySCALE = (MAX_HEIGHT / ROWS) / GRID_SIZE;
var newGridx = xSCALE * GRID_SIZE;
var newGridy = ySCALE * GRID_SIZE;

/* ------------ SOUNDS ---------- */
var mp3LaserShot;
var oggLaserShot;

var mp3PlayerHit;
var oggPlayerHit;
/* ------------------------------ */



//Takes seconds and returns milliseconds
function toMilli(seconds){
    return (seconds * 1000);
}

//Everything that needs to be drawn above everything else.
function HUD(){
    var healthimage = "images/HUD/HealthBar" + player.hp + ".png";
    healthBar.changeImage(healthimage);
    healthBar.update();
}

function Projectile(){
    var tProjectile = new Sprite(scene, 'images/shot.png', (8 * xSCALE), (8 * ySCALE));
    tProjectile.setBoundAction(DIE);
    tProjectile.hide();

    tProjectile.fire = function () {
        tProjectile.setPosition(player.x, player.y);
        tProjectile.setMoveAngle(player.top.getImgAngle() - 90);
        tProjectile.setImgAngle(player.top.getImgAngle() - 90);
        tProjectile.setSpeed(25);
        mp3LaserShot.play();
        oggLaserShot.play();
        tProjectile.show();

    }

    return tProjectile;
}

function makeProjectiles(){
    projectiles = new Array(player.maxProjectiles);
    for (var i = 0; i < player.maxProjectiles; i++){
        projectiles[i] = new Projectile();
    }
}

function updateProjectiles(){
    for (var i = 0; i < player.maxProjectiles; i++){

        /* // This is for rocket-like physics.
        var t = projectiles[i].clock.getElapsedTime();
        var v = projectiles[i].getSpeed();
        if(projectiles[i].getSpeed() < 30){

            projectiles[i].setSpeed(v + (v / (t ^ 2)) * t);
        }
        else{
            projectiles[i].setSpeed(30);
        }
        */

        projectiles[i].update();
    }
}

function user(){

    var character = new Sprite(scene, 'images/PlayerBottom.png', (32 * xSCALE), (32 * ySCALE));

    character.loadAnimation(128, 32, 32, 32);
    character.generateAnimationCycles();
    character.pauseAnimation();
    character.setAnimationSpeed(750);
    character.setSpeed(0);
    character.playAnimation();

    character.setPosition(scene.width / 2, scene.height /2);
    character.maxSpeed = 5;
    character.turnSpeed = 11;
    character.setBoundAction(STOP);
    character.setSpeed(0);
    character.setAngle(0);
    character.setImgAngle(90);

    character.maxProjectiles = 100;
    character.currentProjectile = 0;
    character.projectileDelay = .55;
    character.hp = 8;


    character.top = new Sprite(scene, 'images/PlayerTop.png', (32 * xSCALE), (32 * ySCALE));

    character.top.aim = function () {
        character.top.setImgAngle((this.angleTo(crosshair) - 90));
    };

    character.checkKeys = function () {

        elapsedTime = timer.getElapsedTime();

        if ((keysDown[K_W]) && !(keysDown[K_D] || keysDown[K_S] || keysDown[K_A])) { //NORTH MOVEMENT
            this.setMoveAngle(0);
            wantedAngle = 90;
            if (this.getImgAngle() > 90 && this.getImgAngle() <= 270) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            else if (this.getImgAngle() < 90 || this.getImgAngle() >= 270) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 90) <= this.turnSpeed) {
                this.setImgAngle(90);
            }
        } //END NORTH MOVEMENT
        if ((keysDown[K_S]) && !(keysDown[K_D] || keysDown[K_W] || keysDown[K_A])) { //SOUTH MOVEMENT
            this.setMoveAngle(180);
            wantedAngle = 270;
            if (this.getImgAngle() >= 90 && this.getImgAngle() < 270) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            else if (this.getImgAngle() <= 90 || this.getImgAngle() > 270) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 270) <= this.turnSpeed) {
                this.setImgAngle(270);
            }
        } //END SOUTH MOVEMENT
        if ((keysDown[K_D]) && !(keysDown[K_W] || keysDown[K_S] || keysDown[K_A])) { //EAST MOVEMENT
            this.setMoveAngle(90);
            wantedAngle = 180;
            if (this.getImgAngle() >= 0 && this.getImgAngle() < 180) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            else if (this.getImgAngle() <= 360 && this.getImgAngle() > 180) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 180) <= this.turnSpeed) {
                this.setImgAngle(180);
            }
        } //END EAST MOVEMENT
        if ((keysDown[K_A]) && !(keysDown[K_D] || keysDown[K_S] || keysDown[K_W])) { //WEST MOVEMENT
            this.setMoveAngle(270);
            wantedAngle = 0;
            if (this.getImgAngle() > 0 && this.getImgAngle() <= 180) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            else if (this.getImgAngle() < 360 && this.getImgAngle() > 180) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 360) <= this.turnSpeed || this.getImgAngle() <= this.turnSpeed) {
                this.setImgAngle(0);
            }
        } //END WEST MOVEMENT
        if ((keysDown[K_W] && keysDown[K_D]) || (keysDown[K_D] && keysDown[K_W])) { //NORTHEAST MOVEMENT
            this.setMoveAngle(45);
            wantedAngle = 135;
            if (this.getImgAngle() <= 135 || this.getImgAngle() > 315) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            else if (this.getImgAngle() > 135 && this.getImgAngle() <= 315) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 135) <= this.turnSpeed) {
                this.setImgAngle(135);
            }
        } //END NORTHWEST MOVEMENT
        if ((keysDown[K_W] && keysDown[K_A]) || (keysDown[K_A] && keysDown[K_W])) { //NORTHEAST MOVEMENT
            this.setMoveAngle(315);
            wantedAngle = 45;
            if (this.getImgAngle() > 45 && this.getImgAngle() <= 225) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            else if (this.getImgAngle() < 45 || this.getImgAngle() > 225) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 45) <= this.turnSpeed) {
                this.setImgAngle(45);
            }
        } //END NORTHEAST MOVEMENT
        if ((keysDown[K_S] && keysDown[K_D]) || (keysDown[K_D] && keysDown[K_S])) { //SOUTHEAST MOVEMENT
            this.setMoveAngle(135);
            wantedAngle = 225;
            if (this.getImgAngle() > 45 && this.getImgAngle() <= 225) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            else if (this.getImgAngle() > 225 || this.getImgAngle() <= 45) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 225) <= this.turnSpeed) {
                this.setImgAngle(225);
            }
        } //END SOUTHEAST MOVEMENT
        if ((keysDown[K_S] && keysDown[K_A]) || (keysDown[K_A] && keysDown[K_S])) { //SOUTHWEST MOVEMENT
            this.setMoveAngle(225);
            wantedAngle = 315;
            if (this.getImgAngle() <= 315 && this.getImgAngle() > 135) {
                this.changeImgAngleBy(this.turnSpeed);
            }
            else if (this.getImgAngle() > 315 || this.getImgAngle() <= 135) {
                this.changeImgAngleBy(-(this.turnSpeed));
            }
            if (this.getSpeed() < this.maxSpeed) {
                this.setSpeed(this.getSpeed() + 1);
            }
            else {
                this.setSpeed(this.getSpeed());
            }
            if (Math.abs(this.getImgAngle() - 315) <= this.turnSpeed) {
                this.setImgAngle(315);
            }
        } //END SOUTHWEST MOVEMENT

        else { //SLOWDOWN
            if (this.getSpeed() > 0) {
                this.setSpeed(this.getSpeed() - .50);
                if (this.getSpeed() < .50) {
                    this.setSpeed(0);
                }
            }
        } //END SLOWDOWN

        if (crosshair.isClicked()) {
            if (elapsedTime > character.projectileDelay) {
                character.currentProjectile++;
                if (character.currentProjectile >= character.maxProjectiles) {
                    character.currentProjectile = 0;
                }
                projectiles[character.currentProjectile].fire();
                timer.reset();
            }
        }
        if (this.getImgAngle() < 0) {
            this.setImgAngle(360 - Math.abs(this.getImgAngle()));
        }
        if (this.getImgAngle() >= 360) {
            this.setImgAngle(this.getImgAngle() - 360);
        }

        character.top.setPosition((character.x - 10), (character.y));
        character.top.aim();
        character.top.update();

    }; // END CHECK KEYS FUNCTION


    return character;
}

function Crosshair(){
    var crosshair = new Sprite(scene, "images/Crosshair.png", (32 * xSCALE), (32 * ySCALE));
    crosshair.followMouse = function () {
        this.setX(document.mouseX);
        this.setY(document.mouseY);
    };
    crosshair.setBoundAction(CONTINUE);
    return crosshair;
}

function updateOnlinePlayers() {
    for (var i = 0; i < onlinePlayers.length; i++) {
        if (onlinePlayers[i].id != userID) {
            onlinePlayers[i].update();
        }
    }
}

/*

function Enemy(x,y){
    var tEnemy = new Sprite(scene, "images/testEnemy.png", (32 * xSCALE), (32 * ySCALE));
    tEnemy.setPosition(x,y);
    tEnemy.alive = true;
    tEnemy.setBoundAction(BOUNCE);

    tEnemy.death = function(){
        tEnemy.changeImage("images/EnemyDeath.png");
        tEnemy.loadAnimation(320, 32, 32, 32);
        tEnemy.generateAnimationCycles();
        tEnemy.pauseAnimation();
        tEnemy.setAnimationSpeed(500);
        tEnemy.setSpeed(0);
        tEnemy.playAnimation();
        setTimeout(function(){ tEnemy.hide(); }, tEnemy.animation.animationLength);
    }

    return tEnemy;
}

function WhileLoop(x, y, interval){

    var tLoop = new Sprite(scene, "images/WhileLoop.png", (64 * xSCALE), (64 * ySCALE));
    tLoop.loadAnimation(768, 64, 64, 64);
    tLoop.generateAnimationCycles();
    tLoop.pauseAnimation();
    tLoop.setAnimationSpeed(toMilli(interval));
    tLoop.setSpeed(0);
    tLoop.playAnimation();
    tLoop.setPosition((x * newGridx),(y * newGridy));
    tLoop.setSpeed(0);
    tLoop.hp = 10;
    tLoop.children = [];
    tLoop.spawnTimer = new Timer();
    tLoop.spawnTimer.start();
    tLoop.alive = true;

    tLoop.spawn = function(){
        if(tLoop.hp > 0){
            if(tLoop.spawnTimer.getElapsedTime() >= interval){

                var randDegree = Math.floor((Math.random() * 360) + 1);
                var randSpeed = Math.floor((Math.random() * 20) + 1);

                var child = tLoop.children.length;

                tLoop.children[child] = new Enemy(tLoop.x + 15, tLoop.y + 15);
                tLoop.children[child].setMoveAngle(randDegree);
                tLoop.children[child].setSpeed(randSpeed);
                tLoop.spawnTimer.reset();
            }
        }
        else{
            tLoop.hide();
        }
        for(var i = 0; i < tLoop.children.length; i++){
            tLoop.children[i].update();
        }
    }
    return tLoop;
}

function ForLoop(x, y, index){
    var tLoop = new Sprite(scene, "images/ForLoop.png", (64 * xSCALE), (64 * ySCALE));
    tLoop.setPosition((x * newGridx),(y * newGridy));
    tLoop.setSpeed(0);
    tLoop.hp = 5;
    tLoop.children = [];
    tLoop.i = index;
    tLoop.spawnTimer = new Timer();
    tLoop.spawnTimer.start();
    tLoop.alive = true;

    var j = 0;

    tLoop.spawn = function(){
        if(tLoop.hp > 0){
            if(tLoop.spawnTimer.getElapsedTime() >= 5){
                if(tLoop.i != 0){
                    var randDegree = Math.floor((Math.random() * 360) + 1);
                    var randSpeed = Math.floor((Math.random() * 20) + 1);
                    tLoop.children[j] = new Enemy(tLoop.x + 15, tLoop.y + 15);
                    tLoop.children[j].setMoveAngle(randDegree);
                    tLoop.children[j].setSpeed(randSpeed);
                    tLoop.spawnTimer.reset();
                    j++;
                    tLoop.i -= 1;
                    tLoop.display(tLoop.i);
                    if(tLoop.i == 0){
                        tLoop.hide();
                    }
                }
            }
        }
        else{
            tLoop.hide();
        }

    }
    //Function that displays the "i" value for the For Loop.
    tLoop.display = function(){
        if(tLoop.alive) {
            var ctx = document.getElementById("canvas").getContext("2d");
            ctx.font = "24px Arial";
            var hud = "[" + tLoop.i + "]";
            ctx.textAlign = "center";
            ctx.fillText(hud, tLoop.x, tLoop.y + 5);
        }
    }
    return tLoop;
}

function bringTheLoops(){

    setInterval(function(){whileLoopList[whileLoopList.length] = new WhileLoop(Math.floor((Math.random() * (58 - 3)) + 3), Math.floor((Math.random() * (30 - 3)) + 3), Math.floor((Math.random() * 5) + 1))}, toMilli(15));
    setInterval(function(){ forLoopList[forLoopList.length] = new ForLoop(Math.floor((Math.random() * (58 - 3)) + 3), Math.floor((Math.random() * (30 - 3)) + 3), Math.floor((Math.random() * 9) + 1))}, toMilli(7.5))
}

function loopsSpawn(){
    for (var i = 0; i < whileLoopList.length; i++){
        whileLoopList[i].spawn();
    }
    for (var j = 0; j < forLoopList.length; j++){
        forLoopList[j].spawn();
    }
}

function updateLoops(){
    loopsSpawn();
    for (var i = 0; i < whileLoopList.length; i++){
        whileLoopList[i].update();
    }
    for (var j = 0; j < forLoopList.length; j++){
        forLoopList[j].update();
        if(forLoopList[j].i > 0) {
            forLoopList[j].display();
        }
        for (var k = 0; k < forLoopList[j].children.length; k++){
            forLoopList[j].children[k].update();
        }
    }
}

*/

function checkProjectileCollision(loop){
    for (var i = 0; i < projectiles.length; i++ ){
        for (var j = 0; j < loop.children.length; j++){
            if(projectiles[i].collidesWith(loop.children[j])) {
                loop.children[j].alive = false;
                projectiles[i].hide();
                loop.children[j].death();
            }
        }
        if(projectiles[i].collidesWith(loop)){
            projectiles[i].hide();
            loop.hp--;
            if(loop.hp <= 0){
                loop.alive = false;
                loop.hide();
            }
        }
    }
}

/*
function checkCollision(){
    if(player.hp <= 0){
        GameOver();
    }
    for(var i = 0; i < whileLoopList.length; i++){
        for(var j = 0; j < whileLoopList[i].children.length; j++){
            if(player.collidesWith(whileLoopList[i].children[j]) && whileLoopList[i].children[j].alive){
                whileLoopList[i].children[j].hide();
                player.hp--;
                mp3PlayerHit.play();
                oggPlayerHit.play();
                if(player.hp < 0){
                    player.hp = 0;
                }
            }
        }
        checkProjectileCollision(whileLoopList[i]);
    }
    for(var f = 0; f < forLoopList.length; f++){
        for(var d = 0; d < forLoopList[f].children.length; d++){
            if(player.collidesWith(forLoopList[f].children[d]) && forLoopList[f].children[d].alive){
                forLoopList[f].children[d].hide();
                player.hp--;
                mp3PlayerHit.play();
                oggPlayerHit.play();
            }
        }
        checkProjectileCollision(forLoopList[f]);
    }

}
*/

function healthBar(){
    healthBar = new Sprite(scene, 'images/HUD/HealthBar8.png', 200, 25);
    healthBar.setPosition(200, 15);
    healthBar.show();
    healthBar.setSpeed(0);
    return healthBar;
}

function sceneStretch(){

    //I can haz full-screen?
    if (
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled
    ) {
        var i = document.getElementById("canvas"); //Grabs element (the canvas) to be made fullscreen.
        // go full-screen
        if (i.requestFullscreen) {
            i.requestFullscreen();
        } else if (i.webkitRequestFullscreen) {
            i.webkitRequestFullscreen();
        } else if (i.mozRequestFullScreen) {
            i.mozRequestFullScreen();
        } else if (i.msRequestFullscreen) {
            i.msRequestFullscreen();
        }

    }
    scene.setSizePos(MAX_WIDTH, MAX_HEIGHT, 0, 0);

}


// no more full-screen
function exitFullscreen() {
    if(document.exitFullscreen) {
        document.exitFullscreen();
    } else if(document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if(document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

exitFullscreen();

function GameOver(){
    scene.stop();
    scene.clear();
    var timeSurvived = gameTimer.getElapsedTime();
    var timeSurvivedString = "You Survived " + timeSurvived +" seconds!";
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.textAlign = "center";
    ctx.font = "80px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.fillText("GAME OVER", MAX_WIDTH / 2, MAX_HEIGHT / 2);
    ctx.font = "35px Arial";
    ctx.fillText(timeSurvivedString, MAX_WIDTH/ 2, (MAX_HEIGHT/ 2) + 40);
    setTimeout(function(){ document.location.href = ""; }, toMilli(8));

}

function init(){
    scene = new Scene();
    //sceneStretch();
    timer = new Timer();
    gameTimer = new Timer();
    timer.start();
    gameTimer.start();
    player = new user();

    //send user info to the server

    makeProjectiles();

    //bringTheLoops();


    scene.hideCursor();
    crosshair = new Crosshair();
    healthbar = new healthBar();


    mp3LaserShot = new Sound("sounds/LaserShot.mp3");
    oggLaserShot = new Sound("sounds/LaserShot.ogg");

    mp3PlayerHit = new Sound("sounds/PlayerHit.mp3");
    oggPlayerHit = new Sound("sounds/PlayerHit.ogg");


    scene.start();
} // end init

function update(){
    scene.clear();

    //handle events here
    crosshair.followMouse();

    //handle local update
    player.checkKeys();
    player.update();

    //send info to server
    socket.emit('PlayerInfo', player);


    //get info from server
    socket.emit('getInfo');

    socket.on('Updates', function(data) {
        //console.log('Received updates from server');
        onlinePlayers.splice(0, onlinePlayers.length);
        for (var property in data) {
            var checkID = property.replace(/"/g, '');
            if(checkID != userID) {
                var oPlayer = new Sprite(scene, 'images/Sprite.jpg', (32 * xSCALE), (32 * ySCALE));
                oPlayer.cHeight = data[property].cHeight;
                oPlayer.cWidth = data[property].cWidth;
                oPlayer.x = data[property].x;
                oPlayer.y = data[property].y;
                oPlayer.dx = data[property].dx;
                oPlayer.dy = data[property].dy;
                oPlayer.imgAngle = data[property].imgAngle;
                oPlayer.moveAngle = data[property].moveAngle;
                oPlayer.speed = data[property].speed;
                oPlayer.id = property;


                oPlayer.setPosition(oPlayer.x, oPlayer.y);

                onlinePlayers.push(oPlayer);
            }
        }
    });



    //update other players locally
    updateOnlinePlayers();


    //update all the sprites



    updateProjectiles();
    //updateLoops();
    HUD();
    crosshair.update();
    //checkCollision();
}

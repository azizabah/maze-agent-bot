/// <reference path="mazeAgent.ts" />

"use strict"

let waiting = false;

MazeAgent.availableMazes()
.then(function(mazes){
    console.log(mazes);
});

//while(waiting);


"use strict";

const mz = require("./mazeagent.js");

mz.availableMazes()
.then(mazes => mz.getCell(mazes[0].startUrl))
.then(cell => console.log(cell));


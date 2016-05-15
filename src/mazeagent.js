
"use strict";

const mazeAgentApiUrl = process.env.mazeagentapiurl || "http://mazeagent.malevy.net/api/mazes";

const denodeify = require("denodeify");
const cjClient = require("collection-json");
const cj = denodeify(cjClient);
const util = require("util");

function Maze() {
    this.name = "";
    this.href = "";
    this.startUrl = "";
}

function Door() {
    this.direction="";
    this.href="";
}

function Cell() {
    this.href="";
    this.doors = new Array();
}

// returns Maze[]
function availableMazes() {
        return cj(mazeAgentApiUrl)
            .then(mazesResponse => {
                var mazeFetchers = new Array();
                mazesResponse.items[0].links("maze").forEach(link => mazeFetchers.push(cj(link.href)));
                return Promise.all(mazeFetchers);
            })
            .then(mazeitems => {
                var mazes = new Array();
                mazeitems.forEach(mazeInfo => {
                    let m = new Maze();
                    m.href = mazeInfo["href"];
                    m.name = "maze";
                    m.startUrl = mazeInfo.items[0].links("start")[0].href;
                    mazes.push(m);
                });
                
                return mazes;
            });
}

function getCell(href) {
    if (!!!href) return Promise.reject( new Error("url of the cell is required"));
    
    return cj(href)
        .then(r => {
            let type = r.items[0].datum("type").value;
            if (type !== "cell") {
                throw new Error(util.format("the url %s does not resolve to a cell.", href))
            }
            let cell = new Cell();
            cell.href = href;
            
            // seems to be a bug with the collection+json module
            // that I have to call the links() method with any
            // parameter to get back all of the links.
            r.items[0].links(null).forEach(link => {
                let door = new Door();
                door.direction = link.prompt;
                door.href = link.href;
                cell.doors.push(door);
            });
            
            return cell;
        })
        .catch(err => console.log(err)); 
}

exports.Maze = Maze;
exports.Door = Door;
exports.Cell = Cell;
exports.availableMazes = availableMazes;
exports.getCell = getCell;
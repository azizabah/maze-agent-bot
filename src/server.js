
"use strict";

const mz = require("./mazeagent.js");
//const restify = require("restify");
const builder = require("botbuilder");
const prompts = require("./prompts.js");

const bot = new builder.TextBot(); 

bot.add("/", session => {
    
    // ending the command dialog returns to 
    if (session.userData.stopping) {
        session.endDialog();
        return;
    }
    
    session.send("initializing session");
    if (!!!session.userData.currentCell) {
        mz.availableMazes()
        .then(mazes => mz.getCell(mazes[0].startUrl))
        .then(cell => session.userData.currentCell = cell)
        .then(() => session.send(prompts.intro))
        .then(() => session.beginDialog("/explore"));
    } else {
        session.beginDialog("/explore");
    }
     
});

const exploreDialog = new builder.CommandDialog();
exploreDialog.onBegin(listDoors);

exploreDialog.matches("^north", go("north"));
exploreDialog.matches("^south", go("south"));
exploreDialog.matches("^east", go("east"));
exploreDialog.matches("^west", go("west"));

exploreDialog.matches("^look", listDoors);

exploreDialog.matches("^quit", (session, args) => {
   session.send(prompts.quitMessage);
   session.userData.stopping = true; 
   session.endDialog();
});

exploreDialog.matches("^help", (session) => session.send(prompts.help));

exploreDialog.onDefault([builder.DialogAction.send("I'm sorry. I didn't understand you."), listDoors]);

bot.add("/explore", exploreDialog);

/*
const server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.mazebotport || 53500, function () {
    console.log('%s listening to %s', server.name, server.url); 
});
*/

bot.listenStdin();
//todo - cache cells after they're retrieved
function go(direction) {
    return (session) => {
        const door = session.userData.currentCell.doors
            .find(d => d.direction.toUpperCase() === direction.toUpperCase());
        
        if (door === undefined) {
            session.send(prompts.directionNotPossible)
        } else {
            mz.getCell(door.href)
            .then(cell => session.userData.currentCell = cell)
            .then(() => listDoors(session));
        }    
    };
}

function listDoors(session) {
   const cell = session.userData.currentCell;
   const availableDoors = new Array(); 
   cell.doors.forEach(door => availableDoors.push(door.direction));
   const response = prompts.availablePaths + availableDoors.join(", ");
   session.send(response);
}

"use strict";

const mz = require("./mazeagent.js");
const restify = require("restify");
const builder = require("botbuilder");
const prompts = require("./prompts.js");

const port = process.env.mazebotPort || 53500;
const botAppId = process.env.mazebotAppId || "test-id";
const botAppSecret = process.env.botAppSecret || "test-secret";
const luisAppId = process.env.luisAppId || "fb56d8cb-061b-4423-b819-030f045b1e51";
const luisSubscriptionKey = process.env.luisSubscriptionKey || "b265ce971b9b4646824762e0b397eeed";

const luisEndpoint = "https://api.projectoxford.ai/luis/v1/application?id=" + luisAppId +
                        "&subscription-key=" + luisSubscriptionKey;

const bot = new builder.BotConnectorBot({
    appId: botAppId,
    appSecret: botAppSecret
}); 

const exploreDialog = new builder.LuisDialog(luisEndpoint);
exploreDialog.onBegin(session => {
    resetCurrentCell(session)
        .then(() => session.send(prompts.intro))
        .then(() => listDoors(session));
});
exploreDialog.onDefault([builder.DialogAction.send("I'm sorry. I didn't understand you."), listDoors]);

exploreDialog.on("look", listDoors);

exploreDialog.on("quit", (session, args) => {
   session.send(prompts.quitMessage);
   session.userData.stopping = true; 
   session.endDialog();
});

exploreDialog.on("help", (session) => session.send(prompts.help));

exploreDialog.on("move", (session, args) => {
    let direction = builder.EntityRecognizer.findEntity(args.entities, "direction");
    if (!direction) {
        session.send(prompts.needDirection)
    } else {
        //TODO - remove the indirection
        go(direction.entity)(session);
    }
    
});

bot.add("/", exploreDialog);

const server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(port, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

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

function resetCurrentCell(session) {
    return mz.availableMazes()
    .then(mazes => mz.getCell(mazes[0].startUrl))
    .then(cell => session.userData.currentCell = cell);
}

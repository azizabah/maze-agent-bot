
"use strict";

const mz = require("./mazeagent.js");
const restify = require("restify");
const builder = require("botbuilder");
const prompts = require("./prompts.js");

// iisnode will set the PORT environment variable
const port = process.env.PORT || 3978;
const botAppId = process.env.mazebotAppId || "YourAppId";
const botAppSecret = process.env.botAppSecret || "YourAppSecret";
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
exploreDialog.onDefault([builder.DialogAction.send(prompts.doNotUnderstand), listDoors]);

exploreDialog.on("look", listDoors);

exploreDialog.on("quit", (session, args) => {
   session.send(prompts.quitMessage);
   session.endDialog();
});

exploreDialog.on("help", (session) => session.send(prompts.help));

exploreDialog.on("move", (session, args) => {
    let direction = builder.EntityRecognizer.findEntity(args.entities, "direction");
    if (!direction) {
        session.send(prompts.needDirection)
    } else {
        go(session, direction.entity);
    }
});

bot.add("/", exploreDialog);

const server = restify.createServer();

// hook in the bot framework
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

// any GET returns the intro
server.get(/.*/, restify.serveStatic({
    "directory": __dirname + "/..",
    "file":"index.html",
}));

server.listen(port, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

/**
 * move the user in the given direction if available
 */
function go(session, direction) {
    const door = session.userData.currentCell.doors
        .find(d => d.direction.toUpperCase() === direction.toUpperCase());
    
    if (door === undefined) {
        session.send(prompts.directionNotPossible)
    } else if (direction.toUpperCase() === "EXIT") {
        session.send(prompts.success);
        session.endDialog();
    } else {
        mz.getCell(door.href)
        .then(cell => session.userData.currentCell = cell)
        .then(() => listDoors(session));
    }    
}

/**
 * write the available paths to the conversation
 */
function listDoors(session) {
   const cell = session.userData.currentCell;
   const availableDoors = new Array(); 
   cell.doors.forEach(door => availableDoors.push(door.direction));
   const response = prompts.availablePaths + availableDoors.join(", ");
   session.send(response);
}

/**
 * reset the user to the start of the maze
 */
function resetCurrentCell(session) {
    return mz.availableMazes()
    .then(mazes => mz.getCell(mazes[0].startUrl))
    .then(cell => session.userData.currentCell = cell);
}

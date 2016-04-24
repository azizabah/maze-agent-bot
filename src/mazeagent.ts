
"use strict"

namespace MazeAgent {

    const cjClient = require("collection-json");
    const mazeAgentApiUrl: string = process.env.mazeagentapiurl || "http://mazeagent.malevy.net/api/mazes";

    export class maze {
        name: string;
        href: string;
    }

    export class door {
        direction: string;
        href: string;
    }

    export class cell {
        self: string;
        doors: door[];
    }

    export function availableMazes(): Promise<maze[]> {
        return new Promise<maze[]>((resolve, reject) => {
            cjClient(mazeAgentApiUrl, function (err, collection) {
                if (err && reject) {
                    reject(err);
                    return;
                }

                let mazes = new Array<maze>();
                if (collection.items.length == 0) return mazes;
                collection.items[0].links().forEach(function (link: any) {
                    if (link["rel"] && link["rel"] == "maze") {
                        let m = new maze();
                        m.href = link["href"];
                        m.name = link["prompt"];
                        mazes.push(m);
                    }
                });
                if (resolve) resolve(mazes);
            });
        });
    }

}

"use strict";

let fs = require(`fs`);

fs.readFile(
    `./config.json.dist`,
    `utf8`,
    function (err, data) {
        if (err) {
            console.error(err);

            return;
        }
        let config = JSON.parse(data);
        for (let i in config) {
            if (config[i] in process.env) {
                config[i] = process.env[config[i]]
            }
        }

        fs.writeFile(
            `./config.json`,
            JSON.stringify(config),
            `utf8`,
            function (err) {
                if (err) {
                    console.error(err);
                }
            }
        );
    }
);

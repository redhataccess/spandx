#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const argv = require("yargs").argv;

const spandx = require("./spandx");
const config = require("./config");
const init = require("./init");

async function handleCli() {
    if (argv.v || argv.version) {
        // spandx -v --veresion
        const package = require("../package.json");
        console.log(package.version);
    } else if (argv._[0] === "init") {
        // spandx init
        await init(argv);
    } else {
        // spandx
        const confArg = argv.c || argv.config || "spandx.config.js";
        const confFile = path.resolve(process.cwd(), confArg);
        await spandx.init(confFile);
    }
}

handleCli();

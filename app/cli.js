#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');

const argv = require('yargs').argv;

const spandx = require('./spandx');
const config = require('./config');

if (argv._.includes('init')) {
    const sampleConfigPath = path.resolve(__dirname, '../spandx.config.js');
    const sampleConfig = fs.readFileSync(sampleConfigPath);
    console.log(sampleConfig.toString());
    process.exit(0);
}

const confArg = argv.c || argv.config || 'spandx.config.js';

// resolve the file path relative to the current working directory
const confFile = path.resolve(process.cwd(), confArg);

spandx.init(confFile);

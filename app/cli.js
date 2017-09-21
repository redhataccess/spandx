#!/usr/bin/env node

const argv = require('yargs').argv;
const path = require('path');

const spandx = require('./spandx');
const config = require('./config');

const confArg = argv.c || argv.config || 'spandx.config.js';

// resolve the file path relative to the current working directory
const confFile = path.resolve(process.cwd(), confArg);

spandx.init(confFile);

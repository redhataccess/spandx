const fs   = require('fs');
const path = require('path');
const _    = require('lodash');

const defaultConfig = {
    host: 'localhost',
    port: 1337,
    verbose: false,
    routes: {
        '/': path.resolve(__dirname, 'splash'),
    },
};

let configState = {};

function create(incomingConfig) {
    configState.currentConfig = _.defaults(incomingConfig, defaultConfig);
    return configState.currentConfig;
}

function get() {
    return configState.currentConfig;
}

function fromFile(filePath=`${process.env.HOME}/.spandx`) {
    const fullPath = path.resolve(__dirname, filePath);
    const confObj = require(fullPath);
    return create(confObj);
}

module.exports = {
    create,
    get,
    fromFile,
    defaultConfig,
};

const fs   = require('fs');
const path = require('path');

const _           = require('lodash');
const resolveHome = require('./resolveHome');
const c           = require('print-colors');

const defaultConfig = {
    host: 'localhost',
    port: 1337,
    verbose: false,
    routes: {
        '/': path.resolve(__dirname, 'splash'),
    },
};

let configState = {};

function create(incomingConfig={}, configDir=__dirname) {
    configState.currentConfig = _.defaults(incomingConfig, defaultConfig);
    _.extend(configState.currentConfig, processConf(configState.currentConfig, configDir));
    return configState.currentConfig;
}

function get() {
    return configState.currentConfig;
}

function fromFile(filePath=`${process.cwd()}/spandx.config.js`) {
    const fullPath = path.resolve(__dirname, filePath);
    try {
        const confObj = require(fullPath);
        const conf = create(confObj, path.parse(fullPath).dir);
        return conf;
    }
    catch(e) {
        console.error(`Tried to open spandx config file ${c.fg.l.cyan}${filePath}${c.end} but couldn't find it, or couldn't access it.`);
        process.exit(1);
    }
}

function processConf(conf, configDir=__dirname) {
    // separate the local disk routes from the web routes
    const routeGroups = _(conf.routes)
        .toPairs()
        .partition(pair => _.isObject(pair[1])); // filter out URLs, only want local file paths here

    const webRoutes = routeGroups.get(0);
    const diskRoutes = routeGroups.get(1);

    // build a list of file paths to watch for auto-reload, by combining the
    // local disk route paths with the web routes that provided local paths
    // (web routes can provide an optional path to local files if they want
    // browser-sync to auto-reload their stuff)
    const diskRouteFiles = _(diskRoutes)
        .map(1)
        .map(filePath => path.resolve(configDir, resolveHome(filePath)))
        .value();
    const otherLocalFiles = _(webRoutes)
        .map(1)
        .filter('watch')
        .map('watch')
        .map(filePath => path.resolve(configDir, resolveHome(filePath)))
        .value();

    const files = _.concat(diskRouteFiles, otherLocalFiles);

    // create a list of browserSync 'rewriteRules' that will modify the
    // contents of requests coming back from the proxied remote servers.  this
    // is mainly useful for rewriting links from, say 'www.foo.com' to
    // 'localhost:1337' so that when you click on a link, you stay in your
    // spandx'd environment.
    const rewriteRules = _(webRoutes)
        .map(1)
        .map('host')
        .map(host => ({ match: new RegExp(host, 'g'), replace: `//${conf.host}:${conf.port}`}))
        .value();

    const spandxUrl = `http://${conf.host}:${conf.port}`;

    return {
        routeGroups,
        webRoutes,
        diskRoutes,
        diskRouteFiles,
        otherLocalFiles,
        files,
        rewriteRules,
        spandxUrl,
        configDir,
    };
}

module.exports = {
    create,
    get,
    fromFile,
    defaultConfig,
    process: processConf,
};

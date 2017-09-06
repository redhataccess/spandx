#!/usr/bin/env node

const browserSync      = require('browser-sync');
const http             = require('http');
const url              = require('url');
const path             = require('path');
const connect          = require('connect');
const httpProxy        = require('http-proxy');
const transformerProxy = require('transformer-proxy');
const _                = require('lodash');
const c                = require('print-colors');
const ESI              = require('nodesi');

const config           = require('./config');
const resolveHome      = require('./resolveHome');


function init(confIn) {

    // if initialized with a string, assume it's a file path to a config file
    // if initialized with an object, assume it's a configuration object
    // if initialized with no arguments, use default configuration
    switch (typeof confIn) {
        case 'string':
            conf = config.fromFile(confIn);
            if (conf.verbose) {
                console.log(`configuration: ${c.fg.l.cyan}${confIn}${c.end}`);
            }
            break;
        case 'object':
            conf = config.create(confIn);
            if (conf.verbose) {
                console.log('configuration: custom object');
            }
            break;
        default:
            conf = config.defaultConfig;
            console.log('configuration: defaults');
    }

    const bs = browserSync.create();

    const esi = new ESI({
        baseUrl: `http://${conf.host}:${conf.port}`, // baseUrl enables relative paths in esi:include tags
        onError: (src, error) => {
            console.error(error);
        },
        cache: false,
    });

    function applyESI(data, req, res) {
        return new Promise(function(resolve, reject) {
            esi.process(data.toString()).then(resolve).catch(reject);
        });
    };

    // connect server w/ proxy

    const internalProxyPort = conf.port + 1;
    const internalProxyOrigin = `http://${conf.host}:${internalProxyPort}`;

    const app = connect();
    const proxy = httpProxy.createProxyServer({
        changeOrigin: true,
        autoRewrite: true,
    });
    app.use( transformerProxy(applyESI) );
    app.use( (req, res) => {
        // figure out which target to proxy to based on the requested resource path
        const route = _.find(conf.routes, (v,r) => _.startsWith(req.url, r));
        const target = route.host;
        // if this path has a remote host, proxy to it
        if (target) {
            proxy.web(req, res, { target });
        }
    });
    http.createServer(app).listen(internalProxyPort);

    // separate the local disk routes from the web routes
    const routeGroups = _(conf.routes)
        .toPairs()
        .partition(pair => _.isObject(pair[1])); // filter out URLs, only want local file paths here

    const webRoutes = routeGroups.get(0);
    const diskRoutes = routeGroups.get(1);

    // transform the local disk route object into the format browser-sync // wants in its 'serveStatic' option.
    const serveStatic = _(diskRoutes)
        .map(pair => ({ route: pair[0], dir: path.resolve(__dirname, resolveHome(pair[1]))}))
        .value();

    // build a list of file paths to watch for auto-reload, by combining the
    // local disk route paths with the web routes that provided local paths
    // (web routes can provide an optional path to local files if they want
    // browser-sync to auto-reload their stuff)
    const diskRouteFiles = _(diskRoutes)
        .map(1)
        .map(filePath => path.resolve(__dirname, resolveHome(filePath)))
        .value();
    const otherLocalFiles = _(webRoutes)
        .map(1)
        .filter('watch')
        .map('watch')
        .map(filePath => path.resolve(__dirname, resolveHome(filePath)))
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

    // output for humans
    if (conf.verbose) {
        console.log('Launching spandx with the following configuration');
        console.log();

        console.log('These paths will be routed to the following remote hosts');
        console.log();
        console.log(_.map(webRoutes, route => `  ${c.fg.l.blue}${spandxUrl}${c.end}${c.fg.l.green}${route[0]}${c.e} will be routed to ${c.fg.l.blue}${route[1].host}${c.e}${c.fg.l.green}${route[0]}${c.e}`).join('\n'));
        console.log();

        console.log('These paths will be routed to your local filesystem');
        console.log();
        console.log(_.map(diskRoutes, route => `  ${c.fg.l.blue}${spandxUrl}${c.end}${c.fg.l.green}${route[0]}${c.end} will be routed to ${c.fg.l.cyan}${path.resolve(__dirname, resolveHome(route[1]))}${c.e}`).join('\n'));

        console.log();

        console.log('Your browser will refresh when files change under these paths');
        console.log();
        console.log(_.map(files, file => `  ${c.fg.l.cyan}${file}${c.e}`).join('\n'));
        console.log();

        console.log('These find/replace rules will be used to fix links in remote server responses');
        console.log();
        console.log(_.map(rewriteRules, rule => `  ${c.fg.l.pink}${rule.match}${c.e} will be replaced with "${c.fg.d.green}${rule.replace}${c.e}"`).join('\n'));
        console.log();
    }

    // launch!

    bs.init({
        port: conf.port,
        open: false,
        cors: true,
        online: false,
        ui: false,
        logLevel: conf.verbose ? 'info' : 'silent',
        files,
        serveStatic,
        proxy: {
            target: internalProxyOrigin,
        },
        rewriteRules,
    });

    console.log(`spandx URL:\n\n  ${c.fg.l.blue}${spandxUrl}${c.end}\n`);

}

if (require.main === module) {
    init();
}

module.exports = { init };

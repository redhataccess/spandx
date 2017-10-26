#!/usr/bin/env node

const http             = require('http');
const URL              = require('url');
const path             = require('path');
const fs               = require('fs');

const browserSync      = require('browser-sync');
const connect          = require('connect');
const httpProxy        = require('http-proxy');
const transformerProxy = require('transformer-proxy');
const serveStatic      = require('serve-static');
const finalhandler     = require('finalhandler');
const _                = require('lodash');
const c                = require('print-colors');
const ESI              = require('nodesi');

const config           = require('./config');
const resolveHome      = require('./resolveHome');

let proxy;
let internalProxy;
let bs;

function init(confIn) {

    // if initialized with a string, assume it's a file path to a config file
    // if initialized with an object, assume it's a configuration object
    // if initialized with no arguments, use default configuration
    switch (typeof confIn) {
        case 'string':
            conf = config.fromFile(confIn);
            if (conf.verbose && !conf.silent) {
                console.log(`configuration: ${c.fg.l.cyan}${confIn}${c.end}`);
            }
            break;
        case 'object':
            conf = config.create(confIn);
            if (conf.verbose && !conf.silent) {
                console.log('configuration: custom object');
            }
            break;
        default:
            conf = config.create();
            if (conf.verbose && !conf.silent) {
                console.log('configuration: defaults');
            }
    }

    bs = browserSync.create();

    // for each local file path in the conf, create a serveStatic object for
    // serving that dir
    const serveLocal = _(conf.routes)
        .omitBy(_.isObject)
        .mapValues(dir => serveStatic(path.resolve(conf.configDir, resolveHome(dir)), {redirect:true}))
        .value();

    const esi = new ESI({
        baseUrl: `http://${conf.host}:${conf.port}`, // baseUrl enables relative paths in esi:include tags
        onError: (src, error) => {
            console.error(error);
        },
        cache: false,
    });

    function applyESI(data, req, res) {
        return new Promise(function(resolve, reject) {
            const isHTML = (res.getHeader('content-type') || '').includes('html');
            if (isHTML) {
                esi.process(data.toString()).then(resolve).catch(reject);
            }
            else {
                resolve(data);
            }
        });
    };

    // connect server w/ proxy

    const internalProxyPort = conf.port + 1;
    const internalProxyOrigin = `http://${conf.host}:${internalProxyPort}`;

    const app = connect();
    proxy = httpProxy.createProxyServer({
        changeOrigin: true,
        autoRewrite: true,
        secure: false, // don't validate SSL/HTTPS
        protocolRewrite: 'http',
    });
    app.use( transformerProxy(applyESI) );

    app.use( (req, res, next) => {
        // figure out which target to proxy to based on the requested resource path
        const routeKey = _.findKey(conf.routes, (v,r) => _.startsWith(req.url, r));
        const route = conf.routes[routeKey];
        let target = route.host;
        let fileExists;
        let needsSlash = false;
        const localFile = !target;

        // determine if the URL path maps to a local directory
        // if it maps to a local directory, and if the file exists, serve it
        // up.  if the URL path maps to an HTTP server, OR if it maps to a file
        // but the file doesn't exist, in either case proxy to a remote server.
        if (localFile) {

            const url = URL.parse(req.url);
            const relativeFilePath = url.pathname.replace(new RegExp(`^${routeKey}/?`), '/') // remove route path (will be replaced with disk path)
            const absoluteFilePath = path.resolve(conf.configDir, resolveHome(route), relativeFilePath.replace(/^\//, ''));
            fileExists = fs.existsSync(absoluteFilePath);

            if (fileExists) {
                const oldUrl = req.url;
                const isDir = fs.lstatSync(absoluteFilePath).isDirectory();

                if (conf.verbose) {
                    console.log(`GET ${c.fg.l.green}${req.url}${c.end} from ${c.fg.l.cyan}${absoluteFilePath}${c.end}`);
                }

                req.url = relativeFilePath; // update the request's url to be relative to the on-disk dir
                serveLocal[routeKey](req, res, finalhandler(req, res));
                return; // stop here, don't continue to HTTP proxy section
            }
        }

        if (localFile && (!fileExists || needsSlash)) {
            target = conf.routes['/'].host;
        }

        if (conf.verbose) {
            console.log(`GET ${c.fg.l.green}${req.url}${c.end} from ${c.fg.l.blue}${target}${c.end}${c.fg.l.green}${req.url}${c.end}`);
        }

        proxy.web(req, res, { target }, e => {
            console.error(e);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end();
        });
    });
    internalProxy = http.createServer(app).listen(internalProxyPort);

    // output for humans
    if (conf.verbose) {
        console.log('Launching spandx with the following configuration');
        console.log();

        console.log('These paths will be routed to the following remote hosts');
        console.log();
        console.log(_.map(conf.webRoutes, route => `  ${c.fg.l.blue}${conf.spandxUrl}${c.end}${c.fg.l.green}${route[0]}${c.e} will be routed to ${c.fg.l.blue}${route[1].host}${c.e}${c.fg.l.green}${route[0]}${c.e}`).join('\n'));
        console.log();

        console.log('These paths will be routed to your local filesystem');
        console.log();
        console.log(_.map(conf.diskRoutes, route => `  ${c.fg.l.blue}${conf.spandxUrl}${c.end}${c.fg.l.green}${route[0]}${c.end} will be routed to ${c.fg.l.cyan}${path.resolve(conf.configDir, resolveHome(route[1]))}${c.e}`).join('\n'));

        console.log();

        console.log('Your browser will refresh when files change under these paths');
        console.log();
        console.log(_.map(conf.files, file => `  ${c.fg.l.cyan}${file}${c.e}`).join('\n'));
        console.log();

        console.log('These find/replace rules will be used to fix links in remote server responses');
        console.log();
        console.log(_.map(conf.rewriteRules, rule => `  ${c.fg.l.pink}${rule.match}${c.e} will be replaced with "${c.fg.d.green}${rule.replace}${c.e}"`).join('\n'));
        console.log();
    }

    // launch!

    // create a promise that resolves when browsersync is ready
    const bsReadyPromise = new Promise(resolve => {
        const bsOptions = _.defaultsDeep(
            {
                port: conf.port,
                open: false,
                cors: true,
                online: false,
                ui: false,
                logLevel: conf.verbose ? "info" : "silent",
                files: conf.files,
                proxy: {
                    target: internalProxyOrigin
                },
                rewriteRules: conf.rewriteRules
            },
            conf.bs
        );
        bs.init(bsOptions, () => resolve(bs));
    });


    if (!conf.silent) {
        console.log(`spandx URL:\n\n  ${c.fg.l.blue}${conf.spandxUrl}${c.end}\n`);
    }

    return bsReadyPromise;

}

function exit() {
    if (bs && bs.exit) {
        bs.exit();
    }
    if (internalProxy && internalProxy.close) {
        internalProxy.close();
    }
    if (proxy && proxy.close) {
        proxy.close();
    }
}

if (require.main === module) {
    init();
}

module.exports = { init, exit };

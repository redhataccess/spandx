#!/usr/bin/env node

const http = require("http");
const path = require("path");
const https = require("https");

const browserSync = require("browser-sync");
const connect = require("connect");
const httpProxy = require("http-proxy");
const transformerProxy = require("transformer-proxy");
const _ = require("lodash");
const c = require("print-colors");
const ESI = require("nodesi");
const opn = require("opn");

const router = require("./router.js");
const config = require("./config");
const resolveHome = require("./resolveHome");

let proxy;
let internalProxy;
let bs;

async function init(confIn) {
    // if initialized with a string, assume it's a file path to a config file
    // if initialized with an object, assume it's a configuration object
    // if initialized with no arguments, use default configuration
    switch (typeof confIn) {
        case "string":
            conf = await config.fromFile(confIn);
            if (conf.verbose && !conf.silent) {
                console.log(`configuration: ${c.fg.l.cyan}${confIn}${c.end}`);
            }
            break;
        case "object":
            conf = await config.create(confIn);
            if (conf.verbose && !conf.silent) {
                console.log("configuration: custom object");
            }
            break;
        default:
            conf = await config.create();
            if (conf.verbose && !conf.silent) {
                console.log("configuration: defaults");
            }
    }

    // since this is a local development tool, allow self-signed ssl certificates.
    https.globalAgent.options.rejectUnauthorized = false;

    bs = browserSync.create();

    const esi = _(conf.host)
        .mapValues((host, env) => {
            const esiconfDefaults = {
                baseUrl: `${conf.protocol}//${host}:${conf.port}`, // baseUrl enables relative paths in esi:include tags
                onError: (src, error) => {
                    console.error(
                        `An error occurred while resolving an ESI tag for the ${env} host`
                    );
                    console.error(error);
                },
                cache: false
            };

            return new ESI(_.defaultsDeep(conf.esi, esiconfDefaults));
        })
        .value();

    function applyESI(data, req, res) {
        return new Promise(function(resolve, reject) {
            const env = req.headers["x-spandx-env"];
            const isHTML = (res.getHeader("content-type") || "").includes(
                "html"
            );
            if (isHTML) {
                esi[env]
                    .process(data.toString())
                    .then(resolve)
                    .catch(reject);
            } else {
                resolve(data);
            }
        });
    }

    // connect server w/ proxy

    const internalProxyPort = conf.internalPort;
    const internalProxyOrigin = `http://localhost:${internalProxyPort}`;

    const app = connect();

    proxy = httpProxy.createProxyServer({
        changeOrigin: true,
        autoRewrite: true,
        secure: false, // don't validate SSL/HTTPS
        protocolRewrite: conf.protocol.replace(":", "")
    });

    //
    // app.use((req, res, next) => {
    //     next();
    // });

    // apply ESI
    app.use(transformerProxy(applyESI));

    // dynamically proxy to local filesystem or remote webserver
    app.use(router(conf, proxy));
    internalProxy = http.createServer(app).listen(internalProxyPort);

    // output for humans
    if (conf.verbose) {
        console.log("Launching spandx with the following configuration");
        console.log();

        console.log("These paths will be routed to the following remote hosts");
        console.log();
        console.log(
            _
                .map(conf.webRoutes, route => {
                    return conf.spandxUrl
                        .map(
                            url =>
                                `  ${c.fg.l.blue}${url.replace(/\/$/, "")}${
                                    c.end
                                }${c.fg.l.green}${route[0]}${
                                    c.e
                                } will be routed to ${c.fg.l.blue}${route[1]
                                    .host.default || route[1].host}${c.e}${
                                    c.fg.l.green
                                }${route[0]}${c.e}`
                        )
                        .join("\n");
                })
                .join("\n")
        );
        console.log();

        console.log("These paths will be routed to your local filesystem");
        console.log();
        console.log(
            _
                .map(conf.diskRoutes, route => {
                    return conf.spandxUrl
                        .map(
                            url =>
                                `  ${c.fg.l.blue}${url.replace(/\/$/, "")}${
                                    c.end
                                }${c.fg.l.green}${route[0]}${
                                    c.end
                                } will be routed to ${
                                    c.fg.l.cyan
                                }${path.resolve(
                                    conf.configDir,
                                    resolveHome(route[1])
                                )}${c.e}`
                        )
                        .join("\n");
                })
                .join("\n")
        );

        console.log();

        console.log(
            "Your browser will refresh when files change under these paths"
        );
        console.log();
        console.log(
            _
                .map(conf.files, file => `  ${c.fg.l.cyan}${file}${c.e}`)
                .join("\n")
        );
        console.log();

        console.log(
            "These find/replace rules will be used to fix links in remote server responses"
        );
        console.log();
        console.log(
            _
                .map(
                    conf.rewriteRules,
                    rule =>
                        `  ${c.fg.l.pink}${rule.match}${
                            c.e
                        } will be replaced with "${c.fg.d.green}${
                            rule.replace
                        }${c.e}"`
                )
                .join("\n")
        );
        console.log();
    }

    // launch!

    // create a promise that resolves when browsersync is ready
    const bsReadyPromise = new Promise(resolve => {
        const bsOptions = _.defaultsDeep(
            {
                port: conf.port,
                open: false,
                startPath: conf.startPath,
                cors: true,
                online: false,
                ui: false,
                logLevel: conf.verbose ? "info" : "silent",
                files: conf.files,
                proxy: {
                    target: internalProxyOrigin,
                    proxyReq: [
                        function(proxyReq, proxyRes) {
                            // find and set a header to keep track of the spandx origin
                            const origin = proxyRes.headers.host.split(":")[0];
                            proxyReq.setHeader("X-Spandx-Origin", origin);

                            // find and set a header to keep track of the spandx env
                            const env = _.findKey(
                                conf.host,
                                host => host === origin
                            );
                            proxyReq.setHeader("X-Spandx-Env", env);
                        }
                    ]
                },
                rewriteRules: _.concat(conf.rewriteRules, conf.bs.rewriteRules)
            },
            _.omit(conf.bs, "rewriteRules")
        );
        bs.init(bsOptions, () => {
            if (conf.open) {
                opn(conf.spandxUrl[0]);
            }
            resolve(bs);
        });
    });

    if (!conf.silent) {
        console.log(
            `spandx URL${
                conf.spandxUrl.length > 1 ? "s" : ""
            }:\n\n${conf.spandxUrl
                .map(url => `  ${c.fg.l.blue}${url}${c.end}`)
                .join("\n")}\n`
        );
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

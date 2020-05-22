const chromeCache = require("./chromeCache");
const _ = require("lodash");

function SPACommentResolver(conf) {
    return async function SPACommentResolverMiddleware(data, req, res) {
        const isHTML = (res.getHeader("content-type") || "").includes("html");
        if (isHTML) {
            const origin = req.headers["x-spandx-origin"];
            const options = {};
            let host = `http${conf.bs.https ? "s" : ""}://${origin}:${
                conf.port
            }`;

            if (conf.proxy) {
                options.proxy = conf.proxy;
                // get the env
                const env = _.findKey(conf.host, host => host === origin);
             
                // find the webRoute
                host = conf.webRoutes.map(route => route[1].host[env])[0];
            }

            options.host = host;

            const chromeParts = await chromeCache.getParts(options);
            return data
                .toString()
                .replace(/<!--\s+SPA_HEAD\s+-->/, chromeParts.head)
                .replace(/<!--\s+SPA_HEADER\s+-->/, chromeParts.header)
                .replace(/<!--\s+SPA_FOOTER\s+-->/, chromeParts.footer);
        } else {
            return data;
        }
    };
}

module.exports = { SPACommentResolver };

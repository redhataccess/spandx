const chromeCache = require("./chromeCache");

function SPACommentResolver(conf) {
    return async function SPACommentResolverMiddleware(data, req, res) {
        const isHTML = (res.getHeader("content-type") || "").includes("html");
        if (isHTML) {
            const origin = req.headers["x-spandx-origin"];
            const host = `http${conf.bs.https ? "s" : ""}://${origin}:${
                conf.port
            }`;
            const chromeParts = await chromeCache.getParts({ host });
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

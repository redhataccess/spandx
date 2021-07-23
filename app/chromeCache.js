const got = require("got");

const DEFAULT_CHROME_HOST = "https://access.redhat.com";
const DEFAULT_CHROME_PATH = "/services/chrome/";

const cache = {};
let chromeHost;
let chromePath;

async function getParts({
    host = DEFAULT_CHROME_HOST,
    path = DEFAULT_CHROME_PATH,
    useCached = true,
    legacy = false,
} = {}) {
    if (useCached && cache[host + path]) {
        return cache[host + path];
    }

    const headReq = fetchChromePart({ host, part: "head", path, legacy });
    const headerReq = fetchChromePart({ host, part: "header", path, legacy });
    const footerReq = fetchChromePart({ host, part: "footer", path, legacy });

    const head = await headReq;
    const header = await headerReq;
    const footer = await footerReq;

    const parts = { head, header, footer };

    if (useCached) {
        cache[host + path] = parts;
        chromeHost = host;
        chromePath = path;
    }

    return parts;
}

async function fetchChromePart({
    host = DEFAULT_CHROME_HOST,
    path = DEFAULT_CHROME_PATH,
    part,
    legacy = false,
} = {}) {
    const url = `${host}${path}${part}${legacy ? "?legacy=false" : ""}`;
    console.log(`fetching chrome from ${url}`);

    try {
        const res = await got(url);
        return res.body;
    } catch (e) {
        console.error("GOT BAD HAPPEN");
        console.error(e);
    }
}

module.exports = {
    chromeHost,
    chromePath,
    getParts,
    fetchChromePart,
};

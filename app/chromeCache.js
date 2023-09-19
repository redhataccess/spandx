const got = require("got");

const DEFAULT_CHROME_HOST = "https://access.redhat.com";
const DEFAULT_CHROME_PATH = "/services/chrome/";
const LOCALES = ["en", "ja", "ko", "zh_CN", "fr"];

const cache = {};
let chromeHost;
let chromePath;

async function getParts({
    host = DEFAULT_CHROME_HOST,
    path = DEFAULT_CHROME_PATH,
    useCached = true,
    legacy = false,
    locale = "en",
} = {}) {
    const cacheKey = host + path + locale;
    if (useCached && cache[cacheKey]) {
        return cache[cacheKey];
    }

    const headReq = fetchChromePart({
        host,
        part: "head",
        path,
        legacy,
        locale,
    });
    const headerReq = fetchChromePart({
        host,
        part: "header",
        path,
        legacy,
        locale,
    });
    const footerReq = fetchChromePart({
        host,
        part: "footer",
        path,
        legacy,
        locale,
    });

    const [head, header, footer] = await Promise.all([
        headReq,
        headerReq,
        footerReq,
    ]);

    const parts = { head, header, footer };

    if (useCached) {
        cache[cacheKey] = parts;
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
    locale = "en",
} = {}) {
    const url = `${host}${path}${part}/${locale}${
        legacy ? "?legacy=false" : ""
    }`;
    console.log(`fetching chrome from ${url}`);

    try {
        const res = await got(url);
        return res.body;
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    chromeHost,
    chromePath,
    getParts,
    fetchChromePart,
    LOCALES,
};

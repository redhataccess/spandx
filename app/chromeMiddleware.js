const chromeCache = require("./chromeCache");
const config = require("./config");

function SPACommentResolver(conf) {
    return async function SPACommentResolverMiddleware(data, req, res) {
        const isHTML = (res.getHeader("content-type") || "").includes("html");
        if (isHTML) {
            const locale = getLocaleCookie(req.headers["cookie"]);
            const host = config.getTargetHost(
                conf,
                req.headers["x-spandx-env"],
                "/services/chrome/",
                req.headers["x-spandx-origin"]
            );
            const chromeParts = await chromeCache.getParts({
                host,
                legacy: true,
                locale,
            });

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

function chromeSwapper(conf) {
    return async function ChromeSwapperMiddleware(data, req, res) {
        const isHTML = (res.getHeader("content-type") || "").includes("html");
        const isPrimerAlready = req.url.startsWith("/services/primer");
        if (isHTML && !isPrimerAlready) {
            const host = config.getTargetHost(
                conf,
                req.headers["x-spandx-env"],
                "/services/primer/",
                req.headers["x-spandx-origin"]
            );
            const locale = getLocaleCookie(req.headers["cookie"]);
            const chromeParts = await chromeCache.getParts({
                host,
                path: "/services/primer/",
                locale,
            });

            return data
                .toString()
                .replace(
                    /<!--\s*CP_PRIMER_HEAD\s*-->.*<!--\s*\/CP_PRIMER_HEAD\s*-->/s,
                    `${chromeParts.head}`
                )
                .replace(
                    /<!--\s*CP_PRIMER_HEADER\s*-->.*<!--\s*\/CP_PRIMER_HEADER\s*-->/s,
                    `${chromeParts.header}`
                )
                .replace(
                    /<!--\s*CP_PRIMER_FOOTER\s*-->.*<!--\s*\/CP_PRIMER_FOOTER\s*-->/s,
                    `${chromeParts.footer}`
                );

            // if any tokens were found, swap them
            // if (tokens.result.length) {
            //     tokens.result.sort(
            //         (a, b) => a.outer.startIndex - b.outer.startIndex
            //     );

            //     // TODO make this work when only 1 or 2 of the token pairs were found
            //     const ret =
            //         // body pre-head
            //         body.slice(0, tokens.result[0].outer.startIndex) +
            //         // head
            //         chromeParts.head +
            //         // body post-head
            //         body.slice(
            //             tokens.result[0].outer.endIndex,
            //             tokens.result[1].outer.startIndex
            //         ) +
            //         // header
            //         chromeParts.header +
            //         // body post-header
            //         body.slice(
            //             tokens.result[1].outer.endIndex,
            //             tokens.result[2].outer.startIndex
            //         ) +
            //         // footer
            //         chromeParts.footer +
            //         // body post-footer
            //         body.slice(tokens.result[2].outer.endIndex, body.length);

            //     return "HELLO";
            // }
        }

        return data;
    };
}

function getLocaleCookie(cookies) {
    let locale = "en"; // default
    if (cookies && cookies.includes("rh_locale")) {
        const localeCookie = cookies
            .split(";")
            .filter((c) => c.split("=")[0].trim() === "rh_locale")[0];
        if (localeCookie) {
            const localeCookieValue = localeCookie.split("=")[1].trim();
            if (chromeCache.LOCALES.includes(localeCookieValue)) {
                locale = localeCookieValue;
            } else {
                console.warn(
                    `spandx received rh_locale cookie "${locale}" which is not a supported locale, falling back to "en".  supported locales are ${chromeCache.LOCALES}`
                );
            }
        }
    }
    return locale;
}

module.exports = { SPACommentResolver, chromeSwapper };

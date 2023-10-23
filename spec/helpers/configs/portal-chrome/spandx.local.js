module.exports = {
    host: "localhost",
    port: 1337,
    silent: true,
    portalChrome: {
        resolveSPAComments: true,
    },
    bs: {
        codeSync: false,
        tunnel: false,
    },
    routes: {
        "/services/chrome/": "./mock-chrome",
        "/": "./",
    },
};

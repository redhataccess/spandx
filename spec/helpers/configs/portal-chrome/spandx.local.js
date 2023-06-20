module.exports = {
    host: "localhost",
    port: 1337,
    silent: false,
    verbose: true,
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

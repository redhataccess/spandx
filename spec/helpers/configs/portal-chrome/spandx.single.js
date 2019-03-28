module.exports = {
    host: "localhost",
    port: 1337,
    silent: true,
    portalChrome: {
        resolveSPAComments: true
    },
    routes: {
        "/services/chrome/": "./mock-chrome",
        "/": { host: "http://localhost:4014" }
    }
};

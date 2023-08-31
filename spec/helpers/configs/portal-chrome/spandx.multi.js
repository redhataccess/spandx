module.exports = {
    host: {
        dev: "localhost",
        prod: "127.0.0.1",
    },
    port: 1337,
    silent: true,
    portalChrome: {
        resolveSPAComments: true,
    },
    routes: {
        "/services/chrome/": "./mock-chrome",
        "/": {
            host: {
                dev: "localhost:4014",
                prod: "localhost:4015",
            },
        },
    },
};

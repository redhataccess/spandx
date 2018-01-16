module.exports = {
    host: {
        dev: "localhost",
        prod: "127.0.0.1"
    },
    port: 1337,
    silent: true,
    routes: {
        "/": {
            host: {
                dev: "http://localhost:4014",
                prod: "http://localhost:4015"
            }
        }
    }
};

module.exports = {
    host: {
        dev: "localhost"
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

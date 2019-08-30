module.exports = {
    host: "localhost",
    port: 1337,
    silent: true,
    routes: {
        "/foo": {
            host: "http://localhost:4014",
            path: "/foo/",
            single: true
        },
        "/": {
            host: "http://localhost:4014"
        }
    }
};

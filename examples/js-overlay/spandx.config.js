module.exports = {
    host: "localhost",
    port: 1337,
    open: true,
    startPath: "/",
    verbose: true,
    routes: {
        "/js": "./local/js/",
        "/": {
            host: "http://localhost:8081"
        }
    }
};

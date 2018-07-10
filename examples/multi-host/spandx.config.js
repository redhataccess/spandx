module.exports = {
    host: {
        localhost: "localhost",
        localip: "127.0.0.1"
    },
    port: 1337,
    open: true,
    startPath: "/",
    verbose: true,
    routes: {
        "/": {
            host: {
                localhost: "http://localhost:8081",
                localip: "http://localhost:8082"
            }
        }
    }
};

module.exports = {
    host: "localhost",
    port: 1337,
    silent: true,
    routes: {
        "/subdir": "./local-files/subdir",
        "/": { host: "http://localhost:4014" }
    }
};

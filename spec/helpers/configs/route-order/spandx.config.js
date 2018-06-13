module.exports = {
    host: "localhost",
    port: 1337,
    silent: true,
    routes: {
        "/": "./",
        "/a/b/c": "./c",
        "/a": "./a",
        "/a/b": "./b"
    }
};

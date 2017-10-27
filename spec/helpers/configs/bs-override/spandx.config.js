module.exports = {
    host: "localhost",
    port: 1337,
    silent: true,
    routes: {
        "/": "./",
        // this is a hacky way to get the host to be rewritten when serving from static dirs.
        // TODO implement a better approach
        "/fake/path/for/host/rewrites": { host: "http://localhost:4014" }
    },
    bs: {
        ghostMode: {
            clicks: false,
            scroll: false,
            location: false
        }
    }
};

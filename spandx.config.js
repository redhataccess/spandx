module.exports = {
    host: {
        dev: "dev.foo.redhat.com",
        qa: "qa.foo.redhat.com",
        stage: "stage.foo.redhat.com",
        prod: "prod.foo.redhat.com"
    },
    port: "auto",
    open: !true,
    startPath: "/",
    verbose: true,
    portalChrome: {
        resolveSPAComments: true
    },
    bs: {
        https: true
    },
    routes: {
        // Here are some routing examples to get started.

        // Route a URL path to a local directory.
        "/login": "test/",

        "/foo": "foo/",

        // Route a URL path to an app server.
        // This is most useful for testing local files (esp JS and CSS) against
        // a remote QA or production server.
        "/": {
            host: {
                dev: "https://access.devgssci.devlab.phx1.redhat.com",
                qa: "https://access.qa.redhat.com",
                stage: "https://access.stage.redhat.com",
                prod: "https://access.redhat.com"
            }
        }

        // Route a URL path to an app server, and watch local files for changes.
        // This is most useful for putting a local development at a certain
        // path on your spandx server.  Includes browser-sync auto-reloading.
        // '/': { host: 'http://localhost:8080/', watch: '~/projects/my-app' },
    }
};

const fs = require("fs");

const sslReady =
    fs.existsSync("ssl/spandx.pem") && fs.existsSync("ssl/spandx-key.pem");

if (!sslReady) {
    console.log("Launching with invalid SSL cert 🔓");
} else {
    console.log("Launching with valid SSL cert 🔒");
}

module.exports = {
    host: {
        prod: "prod.foo.redhat.com",
        stage: "stage.foo.redhat.com",
        qa: "qa.foo.redhat.com",
        dev: "dev.foo.redhat.com",
    },
    port: 1337,
    open: false,
    startPath: "/foo",
    verbose: true,
    portalChrome: {
        resolveSPAComments: true,
    },
    primer: {
        // preview: true
    },
    proxy: {
        host: "http://squid.corp.redhat.com:3128",
        pattern: "^https://(.*?).redhat.com",
    },
    bs: {
        https: sslReady
            ? { cert: "ssl/spandx.pem", key: "ssl/spandx-key.pem" } // 🔒
            : true, // 🔓
        codeSync: true,
    },
    routes: {
        "/foo": "dist",

        "/": {
            host: {
                dev: "https://access.dev.redhat.com",
                qa: "https://access.qa.redhat.com",
                stage: "https://access.stage.redhat.com",
                prod: "https://access.redhat.com",
            },
        },
    },
};

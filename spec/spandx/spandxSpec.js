const hush = require("../helpers/hush");

describe("spandx", () => {
    const http = require("http");
    const fs = require("fs");
    const path = require("path");
    const execSync = require("child_process").execSync;
    const execFile = require("child_process").execFile;
    const frisby = require("frisby");

    const serve = require("../helpers/serve");

    const spandxPath = "../../app/spandx";
    let spandx;

    beforeEach(() => {
        spandx = require(spandxPath);
        hush.yourMouth();
    });

    afterEach(() => {
        spandx.exit();
        delete require.cache[require.resolve(spandxPath)];
        hush.speakUp();
    });

    describe("spandx.init()", () => {
        it("should accept default configuration", done => {
            spandx.init().then(() => {
                frisby
                    .get("http://localhost:1337")
                    .expect("status", 200)
                    .expect("bodyContains", /spandx/)
                    .done(done);
            });
        });

        it("should accept a js file", done => {
            // launch a static file server, then init spandx, make a test
            // request, then close the static file server
            spandx
                .init("../spec/helpers/configs/js-or-json/spandx.config.js")
                .then(() => {
                    frisby
                        .get("http://localhost:1337/")
                        .expect("status", 200)
                        .expect("bodyContains", /INDEX/)
                        .done(done);
                });
        });

        it("should accept a json file", done => {
            spandx
                .init("../spec/helpers/configs/js-or-json/spandx.config.json")
                .then(() => {
                    frisby
                        .get("http://localhost:1337/")
                        .expect("status", 200)
                        .expect("bodyContains", /INDEX/)
                        .done(done);
                });
        });

        it("should accept a config object", async done => {
            const { server, port } = await serve(
                "spec/helpers/configs/js-or-json/",
                4014
            );
            await spandx.init({
                /* config object! */
                silent: true,
                routes: {
                    "/": { host: "http://localhost:4014" }
                }
            });

            frisby
                .get("http://localhost:1337/")
                .expect("status", 200)
                .expect("bodyContains", /INDEX/)
                .done(() => {
                    server.close();
                    done();
                });
        });

        it("should accept single-host config", done => {
            serve("spec/helpers/configs/js-or-json/", 4014).then(
                ({ server, port }) => {
                    spandx
                        .init({
                            /* config object! */
                            silent: true,
                            routes: {
                                "/": { host: "http://localhost:4014" }
                            }
                        })
                        .then(() => {
                            frisby
                                .get("http://localhost:1337/")
                                .expect("status", 200)
                                .expect("bodyContains", /INDEX/)
                                .done(() => {
                                    server.close();
                                    done();
                                });
                        });
                }
            );
        });

        it("should accept multi-host config", done => {
            // serve prod dir, then serve dev dir on a different port
            serve("spec/helpers/configs/single-multi/prod", 4015).then(
                ({ server: devServer, port: devPort }) => {
                    serve("spec/helpers/configs/single-multi/dev", 4014).then(
                        ({ server: prodServer, port: prodPort }) => {
                            // launch spandx with two 'environments', dev and
                            // prod.  accessing spandx by localhost should
                            // route requests to '/' route's 'dev' host, and
                            // prod should go to the prod host.
                            spandx
                                .init({
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
                                })
                                .then(() => {
                                    const devReq = frisby
                                        .get("http://localhost:1337/")
                                        .expect("status", 200)
                                        .expect("bodyContains", /DEV/);

                                    const prodReq = frisby
                                        .get("http://127.0.0.1:1337/")
                                        .expect("status", 200)
                                        .expect("bodyContains", /PROD/);

                                    // wait for both request's promises to
                                    // resolve, then close up shop
                                    Promise.all([
                                        devReq._fetch,
                                        prodReq._fetch
                                    ]).then(values => {
                                        devServer.close();
                                        prodServer.close();
                                        done();
                                    });
                                });
                        }
                    );
                }
            );
        });

        it("should reject invalid multi-host configs", done => {
            spandx
                .init({
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
                })
                .then(fail)
                .catch(done);
        });

        it("should allow overriding browserSync settings", done => {
            spandx
                .init("../spec/helpers/configs/bs-override/spandx.config.js")
                .then(bs => {
                    const opts = bs.getOption("ghostMode");
                    expect(opts.get("clicks")).toEqual(false);
                    expect(opts.get("scroll")).toEqual(false);
                    expect(opts.get("location")).toEqual(false);
                    done();
                });
        });
    });

    describe("trailing slashes", () => {
        describe("when routing to local directories", () => {
            it("should resolve root dir without trailing slash", done => {
                spandx
                    .init(
                        "../spec/helpers/configs/root-and-subdir/spandx.local.js"
                    )
                    .then(() => {
                        frisby
                            .get("http://localhost:1337")
                            .expect("status", 200)
                            .expect("bodyContains", /INDEX IN ROOT DIR/)
                            .done(done);
                    });
            });
            it("should resolve root dir with trailing slash", done => {
                spandx
                    .init(
                        "../spec/helpers/configs/root-and-subdir/spandx.local.js"
                    )
                    .then(() => {
                        frisby
                            .get("http://localhost:1337/")
                            .expect("status", 200)
                            .expect("bodyContains", /INDEX IN ROOT DIR/)
                            .done(done);
                    });
            });
            it("should resolve subdir without trailing slash", done => {
                spandx
                    .init(
                        "../spec/helpers/configs/root-and-subdir/spandx.local.js"
                    )
                    .then(() => {
                        frisby
                            .get("http://localhost:1337/subdir")
                            .expect("status", 200)
                            .expect("bodyContains", /INDEX IN SUBDIR/)
                            .done(done);
                    });
            });
            it("should resolve subdir with trailing slash", done => {
                spandx
                    .init(
                        "../spec/helpers/configs/root-and-subdir/spandx.local.js"
                    )
                    .then(() => {
                        frisby
                            .get("http://localhost:1337/subdir/")
                            .expect("status", 200)
                            .expect("bodyContains", /INDEX IN SUBDIR/)
                            .done(done);
                    });
            });
        });

        describe("when routing to remote host", () => {
            it("should resolve root dir without trailing slash", done => {
                serve("spec/helpers/configs/root-and-subdir/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/root-and-subdir/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get("http://localhost:1337")
                                    .expect("status", 200)
                                    .expect("bodyContains", /INDEX IN ROOT DIR/)
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should resolve root dir with trailing slash", done => {
                serve("spec/helpers/configs/root-and-subdir/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/root-and-subdir/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get("http://localhost:1337/")
                                    .expect("status", 200)
                                    .expect("bodyContains", /INDEX IN ROOT DIR/)
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should resolve subdir without trailing slash", done => {
                serve("spec/helpers/configs/root-and-subdir/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/root-and-subdir/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get("http://localhost:1337/subdir")
                                    .expect("status", 200)
                                    .expect("bodyContains", /INDEX IN SUBDIR/)
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should resolve subdir with trailing slash", done => {
                serve("spec/helpers/configs/root-and-subdir/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/root-and-subdir/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get("http://localhost:1337/subdir/")
                                    .expect("status", 200)
                                    .expect("bodyContains", /INDEX IN SUBDIR/)
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
        });
    });

    describe("esi:include", () => {
        describe("when routing to local directories", () => {
            it("should resolve esi:include with absolute paths", done => {
                spandx
                    .init("../spec/helpers/configs/esi-include/spandx.local.js")
                    .then(() => {
                        frisby
                            .get("http://localhost:1337/esi-abs-paths.html")
                            .expect("status", 200)
                            .expect("bodyContains", /ESI ABS PATH PARENT/)
                            .expect("bodyContains", /ABS PATH ROOT SNIPPET/)
                            .expect("bodyContains", /ABS PATH SUBDIR SNIPPET/)
                            .done(done);
                    });
            });
            it("should resolve esi:include with domain-relative paths", done => {
                spandx
                    .init("../spec/helpers/configs/esi-include/spandx.local.js")
                    .then(() => {
                        frisby
                            .get(
                                "http://localhost:1337/esi-domain-rel-paths.html"
                            )
                            .expect("status", 200)
                            .expect(
                                "bodyContains",
                                /ESI DOMAIN REL PATH PARENT/
                            )
                            .expect("bodyContains", /ABS PATH ROOT SNIPPET/)
                            .expect("bodyContains", /ABS PATH SUBDIR SNIPPET/)
                            .done(done);
                    });
            });
            it("should resolve esi:include with file-relative paths", done => {
                spandx
                    .init("../spec/helpers/configs/esi-include/spandx.local.js")
                    .then(() => {
                        frisby
                            .get(
                                "http://localhost:1337/esi-file-rel-paths.html"
                            )
                            .expect("status", 200)
                            .expect("bodyContains", /ESI FILE REL PATH PARENT/)
                            .expect("bodyContains", /REL PATH ROOT SNIPPET/)
                            .expect("bodyContains", /REL PATH SUBDIR SNIPPET/)
                            .done(done);
                    });
            });
        });

        describe("when routing to remote host", () => {
            it("should resolve esi:include with absolute paths", done => {
                serve("spec/helpers/configs/esi-include/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/esi-include/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get(
                                        "http://localhost:1337/esi-abs-paths.html"
                                    )
                                    .expect("status", 200)
                                    .expect(
                                        "bodyContains",
                                        /ESI ABS PATH PARENT/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /ABS PATH ROOT SNIPPET/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /ABS PATH SUBDIR SNIPPET/
                                    )
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should resolve esi:include with domain-relative paths", done => {
                serve("spec/helpers/configs/esi-include/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/esi-include/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get(
                                        "http://localhost:1337/esi-domain-rel-paths.html"
                                    )
                                    .expect("status", 200)
                                    .expect(
                                        "bodyContains",
                                        /ESI DOMAIN REL PATH PARENT/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /ABS PATH ROOT SNIPPET/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /ABS PATH SUBDIR SNIPPET/
                                    )
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should resolve esi:include with file-relative paths", done => {
                serve("spec/helpers/configs/esi-include/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/esi-include/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .get(
                                        "http://localhost:1337/esi-file-rel-paths.html"
                                    )
                                    .expect("status", 200)
                                    .expect(
                                        "bodyContains",
                                        /ESI FILE REL PATH PARENT/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /REL PATH ROOT SNIPPET/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /REL PATH SUBDIR SNIPPET/
                                    )
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should resolve esi:include relative paths over https if https: true", done => {
                // this test covers the case where the esi:include src points
                // to a host with a self-signed cert, and the bug where an
                // esi:include src with a relative path would get routed to
                // http://host/path even if https is true.
                serve("spec/helpers/configs/esi-include/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/esi-include/spandx.https.js"
                            )
                            .then(() => {
                                frisby
                                    .get(
                                        "https://localhost:1337/esi-domain-rel-paths.html"
                                    )
                                    .expect("status", 200)
                                    .expect(
                                        "bodyContains",
                                        /ESI DOMAIN REL PATH PARENT/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /ABS PATH ROOT SNIPPET/
                                    )
                                    .expect(
                                        "bodyContains",
                                        /ABS PATH SUBDIR SNIPPET/
                                    )
                                    .done(() => {
                                        server.close();
                                        done();
                                    })
                                    .catch(err => {
                                        server.close();
                                        fail(err);
                                    });
                            });
                    }
                );
            });
        });
    });

    describe("URL rewriting", () => {
        describe("when routing to local directories", () => {
            it("should rewrite links to match the spandx origin", done => {
                spandx
                    .init(
                        "../spec/helpers/configs/url-rewriting/spandx.local.js"
                    )
                    .then(() => {
                        frisby
                            .setup({
                                request: {
                                    headers: {
                                        Accept: "text/html,*/*"
                                    }
                                }
                            })
                            .get("http://localhost:1337/")
                            .expect("status", 200)
                            .expect("bodyContains", /URL REWRITING INDEX/)
                            .expect("bodyContains", "//localhost:1337")
                            .done(done);
                    });
            });
            it("should rewrite links within ESI fragments to match the spandx origin", done => {
                spandx
                    .init(
                        "../spec/helpers/configs/url-rewriting/spandx.local.js"
                    )
                    .then(() => {
                        frisby
                            .setup({
                                request: {
                                    headers: {
                                        Accept: "text/html,*/*"
                                    }
                                }
                            })
                            .get("http://localhost:1337/index-esi.html")
                            .expect("status", 200)
                            .expect("bodyContains", /URL REWRITING INDEX/)
                            .expect("bodyContains", "//localhost:1337")
                            .done(done);
                    });
            });
        });
        describe("when routing to remote directories", () => {
            it("should rewrite links to match the spandx origin", done => {
                serve("spec/helpers/configs/url-rewriting/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/url-rewriting/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .setup({
                                        request: {
                                            headers: {
                                                Accept: "text/html,*/*"
                                            }
                                        }
                                    })
                                    .get("http://localhost:1337/")
                                    .expect("status", 200)
                                    .expect(
                                        "bodyContains",
                                        /URL REWRITING INDEX/
                                    )
                                    .expect("bodyContains", "//localhost:1337")
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
            it("should rewrite links within ESI fragments to match the spandx origin", done => {
                serve("spec/helpers/configs/url-rewriting/", 4014).then(
                    ({ server, port }) => {
                        spandx
                            .init(
                                "../spec/helpers/configs/url-rewriting/spandx.remote.js"
                            )
                            .then(() => {
                                frisby
                                    .setup({
                                        request: {
                                            headers: {
                                                Accept: "text/html,*/*"
                                            }
                                        }
                                    })
                                    .get("http://localhost:1337/index-esi.html")
                                    .expect("status", 200)
                                    .expect(
                                        "bodyContains",
                                        /URL REWRITING INDEX/
                                    )
                                    .expect("bodyContains", "//localhost:1337")
                                    .done(() => {
                                        server.close();
                                        done();
                                    });
                            });
                    }
                );
            });
        });
    });

    describe("remote fallback", () => {
        it("if a file is not found on a local route, attempt to fetch it from the '/' remote route", done => {
            serve(
                "spec/helpers/configs/remote-fallback/remote-files",
                4014
            ).then(({ server, port }) => {
                spandx
                    .init(
                        "../spec/helpers/configs/remote-fallback/spandx.config.js"
                    )
                    .then(() => {
                        frisby
                            .get(
                                "http://localhost:1337/subdir/remote-only.html"
                            )
                            .expect("status", 200)
                            .expect("bodyContains", /REMOTE ONLY/)
                            .done(() => {
                                server.close();
                                done();
                            });
                    });
            });
        });
        it("if a file exists in both a local route and a remote '/' route, serve the local one", done => {
            serve(
                "spec/helpers/configs/remote-fallback/remote-files",
                4014
            ).then(({ server, port }) => {
                spandx
                    .init(
                        "../spec/helpers/configs/remote-fallback/spandx.config.js"
                    )
                    .then(() => {
                        frisby
                            .get("http://localhost:1337/subdir/index.html")
                            .expect("status", 200)
                            .expect("bodyContains", /LOCAL SUBDIR INDEX/)
                            .done(() => {
                                server.close();
                                done();
                            });
                    });
            });
        });
    });

    describe("command-line flags and output", () => {
        const configPathRel = "./spandx.config.js";
        it("init should generate a sample config", () => {
            const sampleConfig = fs.readFileSync("spandx.config.js").toString();
            const stdout = execSync("node app/cli.js init").toString();
            // ensure `spandx init` output matches the sample config file
            expect(stdout.trim() === sampleConfig.trim()).toBeTruthy();
        });
        it("can be executed with no arguments", done => {
            // launch spandx and scan the output for desired strings
            const shell = execFile(`app/cli.js`);
            let urlPrompted = false;
            let urlPrinted = false;
            shell.stdout.on("data", data => {
                // these ifs look weird, but since the stdout is available only
                // in chunks, we need to check if this is the right chunk
                // before expect()ing it toContain() the strings we're looking
                // for.
                if (!urlPrompted && data.includes("spandx URL")) {
                    urlPrompted = true;
                    expect(data).toContain("spandx URL");
                }
                if (!urlPrinted && data.includes("http://localhost:")) {
                    urlPrinted = true;
                    expect(data).toContain("http://localhost:");
                }
                if (urlPrompted && urlPrinted) {
                    shell.kill();
                    done();
                }
            });
            shell.stderr.on("data", err => {
                fail(err);
                done();
            });
        });
        it("-c should accept a relative config file path", done => {
            // launch spandx and scan the output for desired strings
            const shell = execFile(`app/cli.js`, [`-c`, `${configPathRel}`]);
            let urlPrompted = false;
            let urlPrinted = false;
            shell.stdout.on("data", data => {
                // these ifs look weird, but since the stdout is available only
                // in chunks, we need to check if this is the right chunk
                // before expect()ing it toContain() the strings we're looking
                // for.
                if (!urlPrompted && data.includes("spandx URL")) {
                    urlPrompted = true;
                    expect(data).toContain("spandx URL");
                }
                if (!urlPrinted && data.includes("http://localhost:")) {
                    urlPrinted = true;
                    expect(data).toContain("http://localhost:");
                }
                if (urlPrompted && urlPrinted) {
                    shell.kill();
                    done();
                }
            });
            shell.stderr.on("data", err => {
                fail(err);
            });
        });
        it("-c should accept a absolute config file path", done => {
            // launch spandx and scan the output for desired strings
            const shell = execFile(`app/cli.js`, [
                `-c`,
                `${path.resolve(__dirname, "../../", configPathRel)}`
            ]);
            let urlPrompted = false;
            let urlPrinted = false;
            shell.stdout.on("data", data => {
                // these ifs look weird, but since the stdout is available only
                // in chunks, we need to check if this is the right chunk
                // before expect()ing it toContain() the strings we're looking
                // for.
                if (!urlPrompted && data.includes("spandx URL")) {
                    urlPrompted = true;
                    expect(data).toContain("spandx URL");
                }
                if (!urlPrinted && data.includes("http://localhost:")) {
                    urlPrinted = true;
                    expect(data).toContain("http://localhost:");
                }
                if (urlPrompted && urlPrinted) {
                    shell.kill();
                    done();
                }
            });
            shell.stderr.on("data", err => {
                fail(err);
            });
        });
    });
});

describe('spandx', () => {
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const execSync = require('child_process').execSync;
    const exec = require('child_process').exec;
    const frisby = require('frisby');
    const connect = require('connect');
    const serveStatic = require('serve-static');
    const finalhandler = require('finalhandler');

    const serve = require('../helpers/serve');

    const spandxPath = '../../app/spandx';
    let spandx;

    beforeEach(() => {
        spandx = require(spandxPath);
    });

    afterEach(() => {
        spandx.exit();
        delete require.cache[require.resolve(spandxPath)];
    });

    describe('spandx.init()', () => {
        it('should accept default configuration', done => {
            spandx.init().then(() => {
                frisby.get('http://localhost:1337')
                    .expect('status', 200)
                    .expect('bodyContains', /spandx/)
                    .done(done)
            });
        });

        it('should accept a js file', done => {
            // launch a static file server, then init spandx, make a test
            // request, then close the static file server
            spandx.init('../spec/helpers/configs/js-or-json/spandx.config.js').then(() => {
                frisby.get('http://localhost:1337/')
                    .expect('status', 200)
                    .expect('bodyContains', /INDEX/)
                    .done(done);
            });
        });

        it('should accept a json file', done => {
            spandx.init('../spec/helpers/configs/js-or-json/spandx.config.json').then(() => {
                frisby.get('http://localhost:1337/')
                    .expect('status', 200)
                    .expect('bodyContains', /INDEX/)
                    .done(done);
            });
        });

        it('should accept a config object', done => {
            serve('spec/helpers/configs/js-or-json/', 4014).then(({server, port}) => {
                spandx.init({
                    /* config object! */
                    silent: true,
                    routes: {
                        '/': { host: 'http://localhost:4014' },
                    },
                }).then(() => {
                    frisby.get('http://localhost:1337/')
                        .expect('status', 200)
                        .expect('bodyContains', /INDEX/)
                        .done(() => {
                            server.close();
                            done();
                        })
                });
            });
        });
    });

    describe('trailing slashes', () => {

        describe('when routing to local directories', () => {
            it('should resolve root dir without trailing slash', done => {
                spandx.init('../spec/helpers/configs/root-and-subdir/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337')
                        .expect('status', 200)
                        .expect('bodyContains', /INDEX IN ROOT DIR/)
                        .done(done);
                });
            });
            it('should resolve root dir with trailing slash', done => {
                spandx.init('../spec/helpers/configs/root-and-subdir/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337/')
                        .expect('status', 200)
                        .expect('bodyContains', /INDEX IN ROOT DIR/)
                        .done(done);
                });
            });
            it('should resolve subdir without trailing slash', done => {
                spandx.init('../spec/helpers/configs/root-and-subdir/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337/subdir')
                        .expect('status', 200)
                        .expect('bodyContains', /INDEX IN SUBDIR/)
                        .done(done);
                });
            });
            it('should resolve subdir with trailing slash', done => {
                spandx.init('../spec/helpers/configs/root-and-subdir/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337/subdir/')
                        .expect('status', 200)
                        .expect('bodyContains', /INDEX IN SUBDIR/)
                        .done(done);
                });
            });
        });

        describe('when routing to remote host', () => {
            it('should resolve root dir without trailing slash', done => {
                serve('spec/helpers/configs/root-and-subdir/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/root-and-subdir/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337')
                            .expect('status', 200)
                            .expect('bodyContains', /INDEX IN ROOT DIR/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
            it('should resolve root dir with trailing slash', done => {
                serve('spec/helpers/configs/root-and-subdir/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/root-and-subdir/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337/')
                            .expect('status', 200)
                            .expect('bodyContains', /INDEX IN ROOT DIR/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
            it('should resolve subdir without trailing slash', done => {
                serve('spec/helpers/configs/root-and-subdir/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/root-and-subdir/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337/subdir')
                            .expect('status', 200)
                            .expect('bodyContains', /INDEX IN SUBDIR/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
            it('should resolve subdir with trailing slash', done => {
                serve('spec/helpers/configs/root-and-subdir/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/root-and-subdir/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337/subdir/')
                            .expect('status', 200)
                            .expect('bodyContains', /INDEX IN SUBDIR/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
        });
    });

    describe('esi:include', () => {

        describe('when routing to local directories', () => {
            it('should resolve esi:include with absolute paths', done => {
                spandx.init('../spec/helpers/configs/esi-include/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337/esi-abs-paths.html')
                        .expect('status', 200)
                        .expect('bodyContains', /ESI ABS PATH PARENT/)
                        .expect('bodyContains', /ABS PATH ROOT SNIPPET/)
                        .expect('bodyContains', /ABS PATH SUBDIR SNIPPET/)
                        .done(done);
                });
            });
            it('should resolve esi:include with domain-relative paths', done => {
                spandx.init('../spec/helpers/configs/esi-include/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337/esi-domain-rel-paths.html')
                        .expect('status', 200)
                        .expect('bodyContains', /ESI DOMAIN REL PATH PARENT/)
                        .expect('bodyContains', /ABS PATH ROOT SNIPPET/)
                        .expect('bodyContains', /ABS PATH SUBDIR SNIPPET/)
                        .done(done);
                });
            });
            it('should resolve esi:include with file-relative paths', done => {
                spandx.init('../spec/helpers/configs/esi-include/spandx.local.js').then(() => {
                    frisby.get('http://localhost:1337/esi-file-rel-paths.html')
                        .expect('status', 200)
                        .expect('bodyContains', /ESI FILE REL PATH PARENT/)
                        .expect('bodyContains', /REL PATH ROOT SNIPPET/)
                        .expect('bodyContains', /REL PATH SUBDIR SNIPPET/)
                        .done(done);
                });
            });
        });

        describe('when routing to remote host', () => {
            it('should resolve esi:include with absolute paths', done => {
                serve('spec/helpers/configs/esi-include/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/esi-include/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337/esi-abs-paths.html')
                            .expect('status', 200)
                            .expect('bodyContains', /ESI ABS PATH PARENT/)
                            .expect('bodyContains', /ABS PATH ROOT SNIPPET/)
                            .expect('bodyContains', /ABS PATH SUBDIR SNIPPET/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
            it('should resolve esi:include with domain-relative paths', done => {
                serve('spec/helpers/configs/esi-include/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/esi-include/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337/esi-domain-rel-paths.html')
                            .expect('status', 200)
                            .expect('bodyContains', /ESI DOMAIN REL PATH PARENT/)
                            .expect('bodyContains', /ABS PATH ROOT SNIPPET/)
                            .expect('bodyContains', /ABS PATH SUBDIR SNIPPET/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
            it('should resolve esi:include with file-relative paths', done => {
                serve('spec/helpers/configs/esi-include/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/esi-include/spandx.remote.js').then(() => {
                        frisby.get('http://localhost:1337/esi-file-rel-paths.html')
                            .expect('status', 200)
                            .expect('bodyContains', /ESI FILE REL PATH PARENT/)
                            .expect('bodyContains', /REL PATH ROOT SNIPPET/)
                            .expect('bodyContains', /REL PATH SUBDIR SNIPPET/)
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
        });
    });

    describe('URL rewriting', () => {
        describe('when routing to local directories', () => {
            it('should rewrite links to match the spandx origin', done => {
                spandx.init('../spec/helpers/configs/url-rewriting/spandx.local.js').then(() => {
                    frisby
                        .setup({
                            request: {
                                headers: {
                                    'Accept': 'text/html,*/*'
                                }
                            }
                        })
                        .get('http://localhost:1337/')
                        .expect('status', 200)
                        .expect('bodyContains', /URL REWRITING INDEX/)
                        .expect('bodyContains', '1337')
                        .done(done);
                });
            });
        });
        describe('when routing to remote directories', () => {
            it('should rewrite links to match the spandx origin', done => {
                serve('spec/helpers/configs/url-rewriting/', 4014).then(({server, port}) => {
                    spandx.init('../spec/helpers/configs/url-rewriting/spandx.remote.js').then(() => {
                        frisby
                            .setup({
                                request: {
                                    headers: {
                                        'Accept': 'text/html,*/*'
                                    }
                                }
                            })
                            .get('http://localhost:1337/')
                            .expect('status', 200)
                            .expect('bodyContains', /URL REWRITING INDEX/)
                            .expect('bodyContains', '1337')
                            .done(() => {
                                server.close();
                                done();
                            })
                    });
                });
            });
        });
    });

    describe('command-line flags and output', () => {
        const configPathRel = './spandx.config.js';
        it('init should generate a sample config', () => {
            const sampleConfig = fs.readFileSync('spandx.config.js').toString();
            const stdout = execSync('node app/cli.js init').toString();
            // ensure `spandx init` output matches the sample config file
            expect(stdout.trim() === sampleConfig.trim()).toBeTruthy();
        });
        it('can be executed with no arguments', done => {
            // launch spandx and scan the output for desired strings
            const shell = exec(`node app/cli.js`);
            let urlPrompted = false;
            let urlPrinted = false;
            shell.stdout.on('data', data => {
                // these ifs look weird, but since the stdout is available only
                // in chunks, we need to check if this is the right chunk
                // before expect()ing it toContain() the strings we're looking
                // for.
                if (!urlPrompted && data.includes('spandx URL')) {
                    urlPrompted = true;
                    expect(data).toContain('spandx URL');
                }
                if (!urlPrinted && data.includes('http://localhost:1337')) {
                    urlPrinted = true;
                    expect(data).toContain('http://localhost:1337');
                }
                if (urlPrompted && urlPrinted) {
                    shell.kill();
                    done();
                }
            });
            shell.stderr.on('data', err => {
                fail(err);
            });
        });
        it('-c should accept a relative config file path', done => {
            // launch spandx and scan the output for desired strings
            const shell = exec(`node app/cli.js -c ${configPathRel}`);
            let urlPrompted = false;
            let urlPrinted = false;
            shell.stdout.on('data', data => {
                // these ifs look weird, but since the stdout is available only
                // in chunks, we need to check if this is the right chunk
                // before expect()ing it toContain() the strings we're looking
                // for.
                if (!urlPrompted && data.includes('spandx URL')) {
                    urlPrompted = true;
                    expect(data).toContain('spandx URL');
                }
                if (!urlPrinted && data.includes('http://localhost:1337')) {
                    urlPrinted = true;
                    expect(data).toContain('http://localhost:1337');
                }
                if (urlPrompted && urlPrinted) {
                    shell.kill();
                    done();
                }
            });
            shell.stderr.on('data', err => {
                fail(err);
            });
        });
        it('-c should accept a absolute config file path', done => {
            // launch spandx and scan the output for desired strings
            const shell = exec(`node app/cli.js -c ${path.resolve(__dirname, '../../', configPathRel)}`);
            let urlPrompted = false;
            let urlPrinted = false;
            shell.stdout.on('data', data => {
                // these ifs look weird, but since the stdout is available only
                // in chunks, we need to check if this is the right chunk
                // before expect()ing it toContain() the strings we're looking
                // for.
                if (!urlPrompted && data.includes('spandx URL')) {
                    urlPrompted = true;
                    expect(data).toContain('spandx URL');
                }
                if (!urlPrinted && data.includes('http://localhost:1337')) {
                    urlPrinted = true;
                    expect(data).toContain('http://localhost:1337');
                }
                if (urlPrompted && urlPrinted) {
                    shell.kill();
                    done();
                }
            });
            shell.stderr.on('data', err => {
                fail(err);
            });
        });
    });

});

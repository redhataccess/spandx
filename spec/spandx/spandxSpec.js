describe('spandx', function() {
    const http = require('http');
    const frisby = require('frisby');
    const connect = require('connect');
    const serveStatic = require('serve-static');
    const finalhandler = require('finalhandler');

    const serve = require('../helpers/serve');

    const spandxPath = '../../app/spandx';
    let Spandx;

    beforeEach(function() {
        Spandx = require(spandxPath);
    });

    afterEach(function() {
        Spandx.exit();
        // clear require cache so we can pull in a fresh spandx
        delete require.cache[require.resolve(spandxPath)];
    });

    // init from json and sample request works
    // init from object and sample request works

    describe('spandx.init()', function () {
        it('should accept default configuration', function(done) {
            Spandx.init().then(() => {
                frisby.get('http://localhost:1337')
                    .expect('status', 200)
                    .expect('bodyContains', /spandx/)
                    .done(done)
            });
        });

        it('should accept a js file', function(done) {
            // launch a static file server, then init spandx, make a test
            // request, then close the static file server
            serve('spec/helpers/website/', 4014)
                .then(({server, port}) => {
                    Spandx.init('../spec/helpers/configs/spandx.config.js').then(() => {
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

        it('should accept a json file', function(done) {
            serve('spec/helpers/website/', 4014)
                .then(({server, port}) => {
                    Spandx.init('../spec/helpers/configs/spandx.config.json').then(() => {
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

        it('should accept a config object', function(done) {
            serve('spec/helpers/website/', 4014)
                .then(({server, port}) => {
                    Spandx.init({
                        /* config object! */
                        silent: true,
                        routes: {
                            '/': { host: 'http://localhost:4014' },
                        },

                    }).then(() => {
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
    });

    // describe('when song has been paused', function() {
    //     beforeEach(function() {
    //         player.play(song);
    //         player.pause();
    //     });

    //     it('should indicate that the song is currently paused', function() {
    //         expect(player.isPlaying).toBeFalsy();

    //         // demonstrates use of 'not' with a custom matcher
    //         expect(player).not.toBePlaying(song);
    //     });

    //     it('should be possible to resume', function() {
    //         player.resume();
    //         expect(player.isPlaying).toBeTruthy();
    //         expect(player.currentlyPlayingSong).toEqual(song);
    //     });
    // });

    // // demonstrates use of spies to intercept and test method calls
    // it('tells the current song if the user has made it a favorite', function() {
    //     spyOn(song, 'persistFavoriteStatus');

    //     player.play(song);
    //     player.makeFavorite();

    //     expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
    // });

    // //demonstrates use of expected exceptions
    // describe('#resume', function() {
    //     it('should throw an exception if song is already playing', function() {
    //         player.play(song);

    //         expect(function() {
    //             player.resume();
    //         }).toThrowError('song is already playing');
    //     });
    // });
});

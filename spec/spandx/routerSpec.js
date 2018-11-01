/*global describe, it, require, expect, beforeEach, process*/
process.env.NODE_ENV = "test";
const router = require("../../app/router.js");
const URL = "https://access.redhat.com";

describe("doProxy", () => {
    describe("with target", () => {
        it("should proxy the connection to the target", done => {
            const proxy = {
                web: (req, res, opts) => {
                    expect(opts.target).toBeDefined();
                    expect(opts.target).toEqual(URL);
                    done();
                }
            };
            router.priv.doProxy(proxy, {}, {}, URL);
        });
    });
    describe("without target", () => {
        it("should 404", done => {
            const proxy = {
                web: (req, res, opts) => {
                    throw new Error("should not reach the proxy.web call");
                }
            };

            let state = {};

            router.priv.doProxy(
                proxy,
                {},
                {
                    writeHead: code => {
                        state.code = code;
                    },
                    end: () => {
                        expect(state.code).toBeDefined();
                        expect(state.code).toEqual(404);
                        done();
                    }
                }
            );
        });
    });
});

describe("routerPlugin", () => {
    it("should run the plugin if passed in", done => {
        const plugin = (req, res, target) => {
            return {
                then: cb => {
                    cb(target);
                } // Poor mans Promise
            };
        };

        router.priv.tryPlugin(plugin, {}, {}, URL, target => {
            expect(target).toEqual(URL);
            done();
        });
    });

    it("should let plugins return a new target and modify req, res", done => {
        const plugin = (req, res, target) => {
            req.pluginmod = "foo";
            res.pluginmod = "bar";
            target = `${target}?foo=bar`;
            return {
                then: cb => {
                    cb(target);
                } // Poor mans Promise
            };
        };

        const req = {};
        const res = {};

        router.priv.tryPlugin(plugin, req, res, URL, target => {
            expect(true).toBe(true);
            expect(req.pluginmod).toEqual("foo");
            expect(res.pluginmod).toEqual("bar");
            expect(target).toEqual(`${URL}?foo=bar`);
            done();
        });
    });

    it("should fail if callback is not a function", () => {
        expect(() => {
            router.tryPlugin();
        }).toThrowError(TypeError);
    });
});

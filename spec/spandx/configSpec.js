/*global describe, it, require, expect*/

const config = require("../../app/config.js");

const shouldNotResolve = () => {
    throw new Error("This promise should have been rejected!");
};

const catchSpecificError = (e, name) => {
    if (e.name === name) {
        return;
    }
    throw new Error(`Expected to see a ${name} but got ${e.toString()}`);
};

describe("fromFile", () => {
    it("should load the default config", () => {
        return config.fromFile("../spandx.config.js");
    });

    it("should throw ConfigProcessError on syntax error file", () => {
        return config
            .fromFile("../spec/helpers/configs/invalid/syntax.js")
            .then(shouldNotResolve)
            .catch(e => {
                catchSpecificError(e, "ConfigProcessError");
            });
    });

    it("should throw ConfigOpenError on missing file", () => {
        return config
            .fromFile("/tmp/foo/nonexist/blah/test.js")
            .then(shouldNotResolve)
            .catch(e => {
                catchSpecificError(e, "ConfigOpenError");
            });
    });
});

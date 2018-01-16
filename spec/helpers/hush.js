const log = console.log;
const warn = console.warn;
const error = console.error;

function yourMouth() {
    const noop = () => {};

    console.log = noop;
    console.warn = noop;
    console.error = noop;
}

function restore() {
    console.log = log;
    console.warn = warn;
    console.error = error;
}

module.exports = { yourMouth, restore };

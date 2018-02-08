# spandx examples

Here are some examples of spandx configurations.  Many more can be found in the test suite, but these examples are more real-world than what you'll find in the test suite.

All examples have `verbose: true` so you can see where each request is being routed.

## running examples

To launch an example, simply `cd` to the example that interests you and run the `./start.sh` script.

    cd examples/js-overlay
    ./start.sh

In the case of `js-overlay`, the start script will launch an HTTP Server that we'll call the "remote" server.  Imagine this is your production server.  It has an `index.html` and a `main.js`.  If you view this directly, you'll see "PROD JS!".  If you view it through spandx instead, you'll see the same `index.html`, but the development copy of `main.js` is run instead of the prod version.

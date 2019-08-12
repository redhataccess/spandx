![spandx logo](./spandx-logo.png)

# spandx

Develop locally, proxy to prod, browser-sync, and inject Portal Chrome.

[![Build
Status][build-img]][build]

## Quick-start

*(Note: if you're a developer on the Customer Portal, please use [this guide](./RH.md))*

The quickest way to get started is by installing spandx as a global package.

    npm install -g spandx

Generate a sample configuration file:

    spandx init > spandx.config.js

Launch!

    spandx

The `spandx` command automatically looks for a `spandx.config.js` file in the current directory.  If you prefer to use a different name, or keep the file in a different directory, you can pass in the config file path with the `-c` option, as in `spandx -c ../otherdir/spandx.conf.js`.  Also, if you prefer to store your config file in JSON format, that is also accepted.  JS is the default to allow for commenting your configuration choices.

*Note: spandx requires node.js version 7 or higher.*

## Customizing your configuration

Here are the configuration options accepted by the config file. 

option | description | type
---|---|---
`host` | the hostname spandx is running on, usually "localhost", or a [multi-host](#multi-host-routing) object | string or object
`port` | the port for spandx to listen on, or "auto"  | number or string
`open` | whether to open a browser tab when spandx is launched  | boolean
`startPath` | the URL path to open, if `open` is true. ex: `"/site"`  | string
`verbose` | display English summary of configuration settings and display browserSync logs, or not  | boolean
`routes` | define where to send requests for any number of URL paths, best explained in [routes by example](#routes-by-example) | object
`bs` | a [browserSync config object][bs-options], in case you need to further customize spandx's browserSync instance  | object
`portalChrome` | setting related to Portal Chrome, see [Portal Chrome settings](#portal-chrome-settings) | object

### Routes by example

Route all requests to palebluepixel.org (a perfect reverse proxy), *unless* the request falls under `/theme`, in which case look for files in `~/projects/pbp/theme`.

    routes: {
        "/theme" : "~/projects/pbp/theme/",
        "/"      : { host: "https://palebluepixel.org/" },
    },

Here's how this configuration would play out.

  1. visit localhost:1337 and you see what looks like palebluepixel.org
  2. one exception, the page includes `/theme/site.css`
  3. because it falls under the `/theme` route, spandx fetches `~/projects/pbp/theme/site.css` instead of `palebluepixel.org/theme/site.css`

This effectively overlays a local directory of static files on top of a remote server.  Test in production!

In addition, because `~/projects/pbp/theme` is a local directory, changes to files inside it will trigger a browserSync refresh.

#### Multi-host routing

spandx allows you to "overlay" local static files on top of a remote webserver.  Many projects have multiple remote webservers, for example a dev server, qa, staging, and production.  To simplify dealing with multiple remotes, spandx offers multi-host routing, whether the local hostname determines which remote host to proxy to.  Here's an example config.


```js
module.exports = {
    host: {
 +---<  dev: "dev-local.foo.com",
 |      prod: "prod-local.foo.com"
 |  },
 |  routes: {
 |      "/": {
 |          host: {
 +----------->  dev: "http://dev.foo.com",
                prod: "http://www.foo.com"
            }
        }
    }
};
```

In this case, dev-local.foo.com and prod-local.foo.com should be entered in `/etc/hosts`, pointing to `127.0.0.1`.  Then, when spandx is visited at dev-local.foo.com, spandx knows it's the "dev" host and proxies to dev.foo.com.  The names "dev" and "prod" can be any names you choose.  See the [examples](examples) dir for a working example.


## Installing as a local package in your project

The quick-start has you install spandx as a global package for simplicity, but installing it locally per-project is a better approach in many ways.

Go to your project, install spandx as a dev dependency, and create a config file:

    cd $YOUR_PROJECT
    npm install --save-dev spandx
    node node_modules/.bin/spandx init > spandx.config.js

Modify `spandx.config.js` to reflect the needs of your application.

Then edit your `package.json` and add a `start` script which launches spandx.

    "scripts": {
        "start": "spandx"
    }

Now you and your fellow contributors can run `npm start` without having to install or even understand spandx!

## Miscellaneous commands

Get the current version.

    spandx --version
    spandx -v

## Running specific tests

When writing a test, or debugging a failing test, you may want to run *only* that test instead of the entire suite.  To do that, you can filter by the name of the test.  Just be specific enough to target only the test (or tests) you want to run.

For example, to run the test named "should reject invalid multi-host configs":

    npm test -- --filter="invalid"

## Known issues

### cURLing spandx

The URL-rewriting feature is powered by browserSync's rewriteRules.  However, browserSync will only perform the rewrites if `text/html` is present in the request's `Accept` header.  Web browsers include it by default, but if you're using [cURL][curl], you'll need to add that header in order for URLs to be rewritten.

For example:

    curl -H 'Accept: text/html' localhost:1337

All other spandx features work with or without `text/html` in the `Accept` header.
    

[curl]: https://curl.haxx.se/
[npm]: https://www.npmjs.com/package/spandx
[build-img]: https://travis-ci.org/redhataccess/spandx.png?branch=master
[build]: https://travis-ci.org/redhataccess/spandx
[bs-options]: https://browsersync.io/docs/options

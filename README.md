
![spandx logo](./spandx-logo.png)

[![Build Status][build-img]][build]

# What is spandx?

spandx is an **HTTP switchboard**.  With it, you can weave together pieces of a large, complex website by choosing which resources should come from your local system and which should come from a remote environment.

For example, you could point spandx at your production site, but route `/static/js` to a local directory, which allows you to test your local JS against the production environment.  Code in production, it's fun.

More technically, spandx is a flexible, configuration-based reverse proxy for local development.

# Quick-start

*(Note: if you're a developer on the Customer Portal, please use [this guide][rh-quickstart])*

While I recommend [local install][local-dep], if you want to quickly take spandx for a whirl, the fastest way to get started is by installing spandx as a global package.

    npm install -g spandx

Generate a sample configuration file:

    spandx init > spandx.config.js

Launch!

    spandx

---

# Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Commands](#commands)
  - [spandx](#spandx)
  - [init](#init)
- [Configuration](#configuration)
  - [spandx.config.js](#spandxconfigjs)
  - [Routes](#routes)
    - [Routing to a local directory](#routing-to-a-local-directory)
    - [Routing to a server](#routing-to-a-server)
      - [Multi-host routing](#multi-host-routing)
      - [Path rewriting](#path-rewriting)
      - [single mode](#single-mode)
  - [Overriding Browsersync options](#overriding-browsersync-options)
    - [Enabling HTTPS](#enabling-https)
- [spandx as a local dependency](#spandx-as-a-local-dependency)
- [Contributing](#contributing)
  - [Running specific tests](#running-specific-tests)
- [Known issues](#known-issues)
  - [cURLing spandx](#curling-spandx)
    - [Body URL rewriting](#body-url-rewriting)
    - [single mode URL rewriting](#single-mode-url-rewriting)
- [Alternatives](#alternatives)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Commands

## spandx

To launch spandx, simply run `spandx`.  If a `spandx.config.js` file exists in the current directory, it will be used.

| Option  | Description | Example |
| --- | --- |
| `-c`, `--config` | Specify an alternate config file.  Config files are JS by default (to enable commenting), but JSON is also accepted. | `spandx -c ./configs/spandx.json` |
| `-v`, `--version` | Print the current version of spandx. | `spandx -v` |

## init

Generate a configuration file.  When invoked with no arguments, it prints a barebones config file.  Redirect to a file (this could be improved by writing the file automatically).

```
spandx init > spandx.config.js
```

# Configuration

After `spandx init` has generated a configuration file for you, there are many ways you can tweak it.

## spandx.config.js

Here are the configuration options accepted by the config file. 

Option | Description | Type
---|---|---
`host` | The hostname you wish to use to access spandx. Usually "localhost", or a [multi-host](#multi-host-routing) object. | string or object
`port` | The port for spandx to listen on, or "auto". | number or "auto"
`open` | Whether to open a browser tab when spandx is launched. | boolean
`startPath` | The URL path to open, if `open` is true. ex: `"/site"`. | string
`verbose` | Display English summary of configuration settings and display Browsersync logs, or not. | boolean
`routes` | Define where to send requests for any number of URL paths, best explained in [routes by example](#routes-by-example). | object
`bs` | A [Browsersync config object][bs-options], in case you need to further customize spandx's Browsersync instance. | object
`portalChrome` | Setting related to Portal Chrome, see [Portal Chrome settings][portal-chrome-settings]. | object

## Routes

Routes are the core of spandx's flexibility.  They allow you to define where to pull assets at any given URL path.

Route all requests to palebluepixel.org (a perfect reverse proxy), *unless* the request falls under `/theme`, in which case look for files in `~/projects/pbp/theme`.

    routes: {
        "/theme" : "~/projects/pbp/theme/",
        "/"      : { host: "https://palebluepixel.org/" },
    },

Here's how this configuration would play out.

  1. visit localhost:1337 and you see what looks like palebluepixel.org
  2. one exception, the page includes `/theme/site.css`
  3. because it falls under the `/theme` route, spandx fetches `~/projects/pbp/theme/site.css` instead of `palebluepixel.org/theme/site.css`

This effectively _overlays_ a local directory of static files on top of a remote server.  In other words... test in production!

In addition, because `~/projects/pbp/theme` is a local directory, changes to files inside it will trigger a Browsersync refresh.

### Routing to a local directory

To route to a local directory, the destination should be a string.  The directory path can be absolute or relative.  If relative, it's resolved relative to the spandx.config.js file.

```
routes: {
    "/incoming": "./destination"
}
```

### Routing to a server

To route to a server, the destination should be an object with a `host` property.

```js
routes: {
    "/incoming": {
      host: "http://localhost:8080"
    }
}
```

In this form, requests to `/incoming` will route to `http://localhost:8080/incoming`.  If you would rather route to a different path (such as `http://localhost:8080`), you can specify a `path` property as follows.

#### Multi-host routing

Many projects have multiple remote webservers, for example a dev server, qa, staging, and production.  To simplify dealing with multiple remotes, spandx offers multi-host routing, whether the local hostname determines which remote host to proxy to.  Here's an example config.


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


#### Path rewriting

```js
routes: {
    "/my-app": {
      host: "http://localhost:8080",
      path: "/"
    }
}
```

With this path setting, requests to `/my-app` will route to `http://localhost:8080/`.  This is particularly useful when using a local development server (like webpack-dev-server) where your app lives at `/`.

#### single mode

When a route has `single: true`, spandx will send all requests under that route to a single index.html file (except requests for assets).

This is intended to be used with [`pushState`][pushstate] and enables hash-free user-friendly URLs for single-page apps.

```js
routes: {
    "/my-app": {
      host: "http://localhost:8080",
      single: true
    }
}
```

With this config, a request to `/my-app/users/active` would be routed to `http://localhost:8080/my-app/index.html`.

`single` can also be combined with `path`.

```js
routes: {
    "/my-app": {
      host: "http://localhost:8080",
      path: "/",
      single: true
    }
}
```

Here, a request to `/my-app/users/active` would be routed to `http://localhost:8080/`.

## Overriding Browsersync options

Internally, spandx uses Browsersync to power some features like live-reloading.  Custom [Browsersync options][bs-options] can be embedded in your spandx.config.js file under the `bs` property.

For example, let's enable HTTPS.

### Enabling HTTPS

You can enable HTTPS by 

```js
module.exports = {
    bs: {
        https: true,
    }
};
```

For extra customization (like providing your own certs), see [Browsersync's HTTPS options][bs-https].

# spandx as a local dependency

The quick-start has you install spandx as a global package for simplicity, but installing it locally per-project is a better approach in many ways.

Go to your project, install spandx as a dev dependency, and create a config file:

    cd $YOUR_PROJECT
    npm install --save-dev spandx
    npx spandx init > spandx.config.js

Modify `spandx.config.js` to reflect the needs of your application.

Then edit your `package.json` and add a `start` script which launches spandx.

```json
"scripts": {
    "start": "spandx"
}
```

Now you and your fellow contributors can run `npm start` without having to install or even understand spandx!

# Contributing

Contributions are very welcome!  There's not much here yet, but when there's enough content it can be split out into a dedicated CONTRIBUTING.md.

## Running specific tests

When writing a test, or debugging a failing test, you may want to run *only* that test instead of the entire suite.  To do that, you can filter by the name of the test.  Just be specific enough to target only the test (or tests) you want to run.

For example, to run the test named "should reject invalid multi-host configs":

    npm test -- --filter="invalid"

# Known issues
## cURLing spandx

### Body URL rewriting

The URL-rewriting feature is powered by browserSync's rewriteRules.  However, Browsersync will only perform the rewrites if `text/html` is present in the request's `Accept` header.  Web browsers include it by default, but if you're using [cURL][curl], you'll need to add that header in order for URLs to be rewritten.

For example:

    curl -H 'Accept: text/html' localhost:1337

### single mode URL rewriting

Just like body URL rewriting, the URL rewrite associated with the [`single`][single-mode] also needs the incoming `Accept` header to include `text/html`.

All other spandx features work with or without `text/html` in the `Accept` header.

# Alternatives

If spandx doesn't fit, here are a few other tools that offer similar features.

 - [devd][devd], a local development server with a focus on flexible reverse proxying, much like spandx.  Written in Go.
 - [http-server][http-server], a simple command-line HTTP server.  The `--proxy` flag provides a remote fallback for requests that can't be resolved locally.  Written in JS.
 - [dprox][dprox], a declarative reverse proxy for local development.  Similar configuration philosophy to spandx.



[curl]: https://curl.haxx.se/
[npm]: https://www.npmjs.com/package/spandx
[build-img]: https://travis-ci.org/redhataccess/spandx.png?branch=master
[build]: https://travis-ci.org/redhataccess/spandx
[bs-options]: https://browsersync.io/docs/options
[devd]: https://github.com/cortesi/devd
[http-server]: https://github.com/http-party/http-server#readme
[dprox]: https://github.com/FND/dprox
[single-mode]: #single-mode
[local-dep]: #spandx-as-a-local-dependency
[bs-https]: https://www.browsersync.io/docs/options#option-https
[rh-quickstart]: ./RH.md
[portal-chrome-settings]: ./RH.md#portal-chrome-settings
[pushstate]: https://developer.mozilla.org/en-US/docs/Web/API/History_API

# spandx & Red Hat Customer Portal

This is a guide for adding spandx to any application that is part of the Red Hat Customer Portal ([access.redhat.com](https://access.redhat.com)).

## Quick-start

First, add spandx as a devDependency of your project.

```
npm i -D spandx
```

Then, answer a few questions to create a `spandx.config.js`.

```
npx spandx init cp
```

If you need to, add local DNS entries for `*.foo.redhat.com`.  If you aren't sure if you nee this, it's safe to go ahead and run it.  Note: you'll probably need to `sudo` this command, but if you aren't comfortable doing that, run it without sudo and it will print out what you need to paste into `/etc/hosts`.

```
npx spandx init cp addhosts
```


## Portal Chrome settings

This section describes the Portal Chrome-specific settings in more detail.  The `spandx init cp` command sets good defaults for Customer Portal work, but if you need to customize the settings, read on.

Portal Chrome settings live in your spandx config file under the `portalChrome` property.  It currently only supports one property, `resolveSPAComments`, but more settings may arise in the future.

```js
module.exports = {
    portalChrome: {
        resolveSPAComments: true
    }
};
```

If `resolveSPAComments` is true, spandx will inject Portal Chrome into any `text/html` request that passes through.  It looks for the following placeholder comments and will replace them with the corresponding chrome part.


comment | location | description 
---|---|---
`<!-- SPA_HEAD -->` | within your `<head>` tag | will be replaced with the contents of `/services/chrome/head`
`<!-- SPA_HEADER -->` | just after `<body>` | will be replaced with the contents of `/services/chrome/header`
`<!-- SPA_FOOTER -->` | just before `</body>` | will be replaced with the contents of `/services/chrome/footer`

This setting involves making requests to `/services/chrome/*`, which brings up the question of which host to fetch the chroming from.  To make this as easy as possible, this feature taps into your existing spandx routes.  In short, if you can hit `/services/chrome/head` from your spandx host, you'll be fine.

For example, if you're routing `/app` to your local application and everything else to the Customer Portal, spandx will be able to resolve `/services/chrome/*` just fine.

```js
routes: {
    '/app' : { host: "http://localhost:8080" },
    '/'    : { host: 'https://access.redhat.com' }
}
```



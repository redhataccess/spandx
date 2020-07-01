## [2.1.2](https://github.com/redhataccess/spandx/compare/v2.1.1...v2.1.2) (2020-07-01)


### Bug Fixes

* Do not use ESI middleware for text streams ([#141](https://github.com/redhataccess/spandx/issues/141)) ([8a291d6](https://github.com/redhataccess/spandx/commit/8a291d6006e55d465d863bfbc8742a8448c9de0c))



## [2.1.1](https://github.com/redhataccess/spandx/compare/v2.1.0...v2.1.1) (2020-06-25)

### Bug Fixes

* respond with a 502 when remote is unreachable ([#145](https://github.com/redhataccess/spandx/issues/145)) ([4ac3e24](https://github.com/redhataccess/spandx/commit/4ac3e24f8c3752c4691b08d9285fda4ac8932f6d))


# [2.1.0](https://github.com/redhataccess/spandx/compare/v2.0.1...v2.1.0) (2020-05-27)


### Features

* adding the ability to use a proxy server for certain paths ([#143](https://github.com/redhataccess/spandx/issues/143)) ([a220c9e](https://github.com/redhataccess/spandx/commit/a220c9eb189aed3f7dfe0721c793ac39e1fd090c))



## [2.0.1](https://github.com/redhataccess/spandx/compare/v2.0.0...v2.0.1) (2019-10-18)


### Bug Fixes

* npm install error related to 'opn' dependency ([fcbf726](https://github.com/redhataccess/spandx/commit/fcbf726e014b5609726c95e96240dcea4b992e50))


# 2.0.0

## Breaking changes

ESI is no longer enabled by default.  Adding `esi: true` to spandx.config.js will re-enable it.

## Changes

 - 28b8a39 allow custom configuration of ESI
 - b614c96 revamp README
 - 62e285c add `single` setting for routes
 - 6c03e75 add `path` setting for routes
 - f6da858 fix esi config with multiple hosts, allow overwriting esi config
 - c21e2bb extract esi middleware into a separate file
 - 2ac5661 restore esi
 - cdd9f39 add `init cp` for bootstrapping Customer Portal spandx projects
 - 83e9a77 set X-Spandx headers to responses as well as requests
 - addde0d fix remote route logging of [object Object] (#56)
 - bb8cb2e fix console output of path in local filesystem routes
 - c58af4b ensure that test cases wait for static server to close (#53)
 - fcb00d9 add Portal Chrome injection settings
 - adff1fb Introduce a plugin system for router.js (#31)
 - 530f8aa Add renovate for automatic dependency version updates
 - 
## Dependency updates

 - a3cad89 Bump lodash from 4.17.10 to 4.17.11
 - 80eeb68 Bump ecstatic from 3.2.0 to 3.3.2
 - 194ec24 Update dependency nodemon to v1.19.2
 - 4248c2d Update dependency husky to v3.0.5
 - 9761bae Update dependency lint-staged to v9.2.5
 - 69128d9 Update dependency inquirer to v7
 - 5f877c7 Update dependency yargs to v14
 - fdd9692 Update dependency prettier to v1.18.2
 - b4424e2 Update dependency frisby to v2.1.2
 - 81e268e Update dependency jasmine to v3.4.0 (#47)
 - dfbaadd Update dependency opn to v5.5.0 (#32)

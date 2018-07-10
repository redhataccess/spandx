#!/usr/bin/env bash

# launch a webserver to act as the 'remote' server
../../node_modules/.bin/http-server remote1 -p 8081 &
../../node_modules/.bin/http-server remote2 -p 8082 &

# launch spandx
../../app/cli.js


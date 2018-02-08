#!/usr/bin/env bash

# launch a webserver to act as the 'remote' server
../../node_modules/.bin/http-server remote &

# launch spandx
../../app/cli.js


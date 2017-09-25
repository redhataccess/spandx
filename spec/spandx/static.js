const http = require('http');
const frisby = require('frisby');
const connect = require('connect');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

const serve = serveStatic('../helpers/website/');
const server = http.createServer((req, res) => {
    const done = finalhandler(req, res);
    serve(req, res, done);
});
server.listen(null, null, null, () => {
    const port = server.address().port;
    console.log(`http://localhost:${port}`);
});

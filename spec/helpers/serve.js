const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

function serve(path, requestedPort=null) {
    return new Promise(resolve => {
        const serve = serveStatic('spec/helpers/website/');
        const server = http.createServer((req, res) => {
            const fh = finalhandler(req, res);
            serve(req, res, fh);
        });
        server.listen(requestedPort, null, null, () => {
            const port = server.address().port;
            resolve({ server, port });
        });
    });
}

module.exports = serve;

const _ = require("lodash");
const ESI = require("nodesi");

function buildEsiMap(conf) {
    const esi = _(conf.host)
        .mapValues((host, env) => {
            const esiconfDefaults = {
                baseUrl: `${conf.protocol}//${host}:${conf.port}`, // baseUrl enables relative paths in esi:include tags
                onError: (src, error) => {
                    console.error(
                        `An error occurred while resolving an ESI tag for the ${env} host`
                    );
                    console.error(error);
                },
                cache: false
            };

            const config = _.defaultsDeep(
                _.cloneDeep(conf.esi),
                esiconfDefaults
            );

            const esi = new ESI(config);

            esi.spandxGeneratedConfig = config;

            return esi;
        })
        .value();

    return esi;
}

function createEsiMiddleware(conf) {
    const esi = buildEsiMap(conf);

    function applyESI(data, req, res) {
        return new Promise(function(resolve, reject) {
            const env = req.headers["x-spandx-env"];
            const isHTML = (res.getHeader("content-type") || "").includes(
                "html"
            );
            if (isHTML) {
                esi[env]
                    .process(data.toString())
                    .then(data => Buffer.from(data))
                    .then(resolve)
                    .catch(reject);
            } else {
                resolve(data);
            }
        });
    }
    return applyESI;
}

module.exports = { buildEsiMap, createEsiMiddleware };

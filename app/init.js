const fs = require("fs");
const path = require("path");

const c = require("print-colors");

module.exports = async function spandxInit(argv) {
    // if a site name is provided to init, look for and run that site's init script
    const siteProvided = argv._.length >= 2;

    if (siteProvided) {
        const siteName = argv._[1];

        const initScript = path.resolve(
            __dirname,
            `./inits/${siteName}/init.js`
        );

        const siteExists = fs.existsSync(initScript);
        if (siteExists) {
            console.log(
                `Initializing ${c.fg.l.cyan}${siteName}${c.end} config`
            );
            await require(initScript)(argv);
        } else {
            console.error(
                `No init script found for site ${c.fg.l.cyan}${siteName}${
                    c.end
                }`
            );
        }
    } else {
        const configName = "spandx.config.js";
        const sampleConfigPath = path.resolve(__dirname, `../${configName}`);
        const sampleConfig = fs.readFileSync(sampleConfigPath);
        console.log(sampleConfig.toString());
    }
};

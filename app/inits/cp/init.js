const fs = require("fs");
const { promisify } = require("util");

const inquirer = require("inquirer");
const c = require("print-colors");

const writeFileAsync = promisify(fs.writeFile);

function generateConfig(answers) {
    return `const fs = require("fs");

const sslReady =
  fs.existsSync("ssl/primer.pem") && fs.existsSync("ssl/primer-key.pem");

if (!sslReady) {
  console.log("Launching with self-signed 🔓https");
  console.log("To set up valid 🔒https, see README.md");
}

module.exports = {
    host: {
        dev: "dev.foo.redhat.com",
        qa: "qa.foo.redhat.com",
        stage: "stage.foo.redhat.com",
        prod: "prod.foo.redhat.com",
    },
    port: 1337,
    open: true,
    startPath: "${answers.path}",
    verbose: true,
    portalChrome: {
        resolveSPAComments: true
    },
    primer: {
        // preview: true
    },
    proxy: {
        host: "http://squid.corp.redhat.com:3128",
        pattern: "^https:\/\/(.*?).redhat.com"
    },
    bs: {
        https: sslReady
          ? { cert: "ssl/chrome.pem", key: "ssl/chrome.pem" } // 🔒
          : true, // 🔓
        codeSync: ${answers.livereload || true}
    },
    routes: {${
        /* sorry about this formatting... */
        answers.location === "dir"
            ? `
        "${answers.path}": "${answers.dir}",
`
            : ""
    }${
        answers.location === "server"
            ? `
        "${answers.path}": {
            host: "${answers.host}"
        },
`
            : ""
    }
        "/": {
            host: {
                dev: "https://access.dev.redhat.com",
                qa: "https://access.qa.redhat.com",
                stage: "https://access.stage.redhat.com",
                prod: "https://access.redhat.com",
            }
        }
    }
}`;
}

async function writeHosts() {
    const hostile = require("hostile");
    const set = promisify(hostile.set);

    const hostnames = [
        "dev.foo.redhat.com",
        "qa.foo.redhat.com",
        "stage.foo.redhat.com",
        "prod.foo.redhat.com",
    ];

    try {
        await set("127.0.0.1", hostnames.join(" "));
        console.log(
            `Added ${c.fg.l.cyan}cp${c.end} hostnames to ${hostile.HOSTS}`
        );
    } catch (e) {
        console.error(
            `Unable to write ${hostile.HOSTS}.  Either try again with sudo, or copy the following into your ${hostile.HOSTS} file.
            `
        );
        console.error(`127.0.0.1 ${hostnames.join(" ")}`);
    }
}

async function writeConfig() {
    const dirCheck = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmDir",
            message: `Your current directory, \`${process.cwd()}\`, has no package.json file, do you still wish to generate spandx.config.js here?`,
            when: () => !fs.existsSync("./package.json"),
        },
        {
            type: "confirm",
            name: "confirmOverwrite",
            message: `spandx.config.js already exists in your current directory, do you wish to overwrite it?`,
            when: () => fs.existsSync("./spandx.config.js"),
        },
    ]);

    ["confirmDir", "confirmOverwrite"].forEach((confirm) => {
        if (dirCheck.hasOwnProperty(confirm) && !dirCheck[confirm]) {
            console.log(`Aborting.`);
            process.exit(0);
        }
    });

    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "path",
            message: "Path (ex: /support/cases or /search)",
            validate: (value) => {
                console.log(value);
                const startsWithSlash = value.startsWith("/");
                const noWhitespace = !/\s/.test(value);
                const valid = startsWithSlash && noWhitespace;

                const messages = [];

                if (!startsWithSlash) {
                    messages.push("path must start with '/'");
                }
                if (!noWhitespace) {
                    messages.push("path must not contain whitespace");
                }

                return valid || messages.join(", ");
            },
        },
        {
            type: "list",
            name: "location",
            message:
                "Should spandx load your app from a static dist directory, or from a local dev server (such as webpack-dev-server)?",
            choices: [
                {
                    name: "dev server",
                    value: "server",
                },
                { name: "dist directory", value: "dir" },
            ],
        },
        {
            type: "input",
            name: "host",
            default: "localhost:8080",
            message: "What is your local dev server's URL?",
            when: (answers) => answers.location === "server",
            filter: (answer) => {
                const missingProtocol = !/https?:\/\//.test(answer);
                if (missingProtocol) {
                    // default to http
                    return `http://${answer}`;
                } else {
                    return answer;
                }
            },
        },
        {
            type: "confirm",
            name: "livereload",
            default: true,
            message:
                "Enable spandx's livereload?  If your dev server provides LiveReload/browser-sync, choose No.",
            when: (answers) => answers.location === "server",
        },
        {
            type: "input",
            name: "dir",
            default: "dist",
            message:
                "What is the path to your dist directory?  It should be relative to your project root (where package.json is).",
            when: (answers) => answers.location === "dir",
        },
    ]);

    try {
        await writeFileAsync("spandx.config.js", generateConfig(answers));
    } catch (e) {
        console.error(
            `Writing spandx.config.js failed.  Original error below:`
        );
        console.error(e);
        process.exit(1);
    }

    console.log(`Created spandx.config.js`);
    console.log(
        "One last step to enable resolving local hostnames like 'stage.foo.redhat.com'"
    );
    console.log();
    console.log("  spandx init cp addhosts");
}

module.exports = async function initCP(argv) {
    if (argv._.length === 2) {
        writeConfig(argv);
    } else if (argv._.length === 3) {
        writeHosts();
    } else {
        console.error(`Couldn't initialize cp, invalid arguments given.`);
    }
};

const util = require("./util");

const { doesFileExist } = util;

const CONFIG_FILE = "./importResolver.json";

const defaultConfig = {
    // file types to examine
    fileTypes: [".js", ".jsx"],

    // file extensions that are missing from references (import './config' has no extension but probably means js or jsx)
    missingExtensions: [".js", ".jsx"],

    // folders to exclude
    exclude: [".git", "node_modules", "coverage"],

    // future support for mandating no other changes
    requireGitClean: false,

    // What algoritthm to use for solving imports that are broken.
    // Needed to handle cases where the same file name appears in multiple locations throughout the tree.
    //  * first - picks the first filepath with the filename that matches
    //  * random - random
    //  * closest - picks the minimum path where each '../' and folder counts as 1
    //  * rightPath - picks the version whose rightmost/lowest path most closely matches
    //  * minDistance - uses https://en.wikipedia.org/wiki/Edit_distance algos to compute distance
    // TODO: Find a smart way to combine several of these (or maybe a few smart ways)
    resolveAlgo: "first"
};

/**
 * Loads the config file from the file provided on teh command line or the canonically named json file
 */
const getConfig = () => {
    const args = process.argv.splice(2);
    if (args.length > 0 && doesFileExist(args[args.length - 1])) {
        return require(args[args.length - 1]);
    }

    if (doesFileExist(CONFIG_FILE)) {
        return require(CONFIG_FILE);
    }

    // default
    return defaultConfig;
};

module.exports = {
    getConfig,
    defaultConfig
};

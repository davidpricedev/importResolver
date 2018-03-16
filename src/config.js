const util = require("./io");
const R = require("ramda");
const { List } = require("monet");

const { doesFileExist } = util;

const EXPECTED_CONFIG_NAME = "./importResolver.json";

/*
export type Config = {
    // file types to examine
    fileTypes: string[],


    // file extensions that are missing from references
    //  (import './config' has no extension but probably means js or jsx)
    missingExtensions: string[],

    // folders to exclude 
    // TODO: replace with proper glob handling
    exclude: string[],

    // future: support for mandating no other changes
    requireGitClean: boolean,

    // What algoritthm to use for solving imports that are broken.
    // Needed to handle cases where the same file name appears in multiple locations throughout the tree.
    //  * first - picks the first filepath with the filename that matches
    //  * random - random
    //  * closest - picks the minimum path where each '../' and folder counts as 1
    //  * rightPath - picks the version whose rightmost/lowest path most closely matches
    //  * minDistance - uses https://en.wikipedia.org/wiki/Edit_distance algos to compute distance
    // TODO: Find a smart way to combine several of these (or maybe a few smart ways)
    resolveAlgo: string
};
*/

const defaultConfig = () => ({
    fileTypes: [".js", ".jsx", ".mjs", ".ts", ".tsx"],
    missingExtensions: [".js", ".jsx", ".mjs", ".ts", ".tsx"],
    exclude: [".git", "node_modules", "coverage"],
    requireGitClean: false,
    resolveAlgo: "first",
});

/**
 * Loads the config file from the file provided on teh command line or the canonically named json file
 */
const getConfig = rawArgs =>
    List.fromArray(rawArgs)
        .reverse()
        .headMaybe()
        .map(
            R.cond([
                [doesFileExist, require],
                [
                    () => doesFileExist(EXPECTED_CONFIG_NAME),
                    () => require(EXPECTED_CONFIG_NAME),
                ],
                [R.T, defaultConfig()],
            ])
        )
        .orSome(defaultConfig());

module.exports = {
    getConfig,
    defaultConfig,
};

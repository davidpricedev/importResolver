const { cond, contains } = require('ramda');
const { List, reduceObj } = require('./adts');
const { I, K, T } = require('./combinators');
const { requireCwd, doesFileExist } = require('./io');

const EXPECTED_CONFIG_NAME = './importResolver.json';

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
    //  * minDistance - uses https://en.wikipedia.org/wiki/Edit_distance algos to compute distance
    // TODO: Find a smart way to combine several of these (or maybe a few smart ways)
    resolveAlgo: string
};
*/

const defaultConfig = () => ({
  // to care about fixing references in
  fileTypes: ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.json', '.png'],

  // extensions excluded by require/import
  missingExtensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.json'],

  // folders to exclude
  exclude: ['.git', 'node_modules', 'coverage'],

  requireGitClean: false,
  resolveAlgo: 'closest',
});

/**
 * Loads the config file from the file provided on teh command line or the canonically named json file
 */
const getConfig = rawArgs =>
  List.of([getConfigFileContent, getDryRun])
    .map(T(rawArgs))
    .reduce(reduceObj);

const getConfigFileContent = args =>
  List.of(args)
    .maybeLast()
    .coalesce(findBestConfig, findBestConfig)
    .fold(I);

const cmdArgCase = () => [doesFileExist, requireCwd];

const wellKnownCase = () => [
  () => doesFileExist(EXPECTED_CONFIG_NAME),
  () => requireCwd(EXPECTED_CONFIG_NAME),
];

const defaultCase = () => [K(true), defaultConfig];

const findBestConfig = cond([cmdArgCase(), wellKnownCase(), defaultCase()]);

const getDryRun = args => ({ dryRun: isDryRun(args) });
const isDryRun = contains('--dry-run');

module.exports = {
  getConfig,
  defaultConfig,
};

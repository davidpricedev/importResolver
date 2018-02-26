const R = require("ramda");
const path = require("path");
const { calculateDistance } = require("./editDistance");

/**
 * Returns the resolvor function that should be used based on the config algorithm.
 * @param {any} config - the configuration object
 * @param {string} filename - the file containing the relative path
 * @param {string} refpath - a (relative) path found in the file
 * @param {string[]} options - list of locations that match the name of the file in the path
 * TODO: provide a weighted combination that takes all of it into account
 */
const resolver = config => {
    switch (config.resolveAlgo) {
        case "first":
            return composeFirstTruthy(resolveValidation, first);
        case "random":
            return composeFirstTruthy(resolveValidation, random);
        case "closest":
            return composeFirstTruthy(resolveValidation, closest);
        case "editDistance":
            return composeFirstTruthy(resolveValidation, editDistance);
        default:
            console.log("Unknown / not implemented resolver option.");
            return composeFirstTruthy(resolveValidation, first);
    }
};

const resolveObj = (filename, oldpath, newpath) => {
    return {
        filename,
        oldpath,
        newpath
    };
};

/**
 * Takes a list of functions and a set of arguments to be applied to those functions.
 * Runs through the list and returns the first truthy value returned from a function.
 * @param {functions[]} Fns
 * @param {any} args
 */
const composeFirstTruthy = (...Fns) =>
    R.curry((...args) => Fns.reduce(firstTruthyReducer(...args), null));

const firstTruthyReducer = (...args) => (a, x) => (a ? a : x(...args));

const resolveValidation = (filename, refpath, options) => {
    if (!options || options.length === 0)
        throw new Error("you must supply options");

    if (options.length === 1) return resolveObj(filename, refpath, options[0]);
};

/**
 * Not really any better than random...
 */
const first = (filename, refpath, options) => {
    return resolveObj(filename, refpath, options[0]);
};

/**
 * Shortest distance between the file and the refpath option.
 * Good for converting to better app-like organization structure
 *  (where apart from common utils, files should be close to the referenced files).
 */
const closest = (filename, refpath, options) => {
    return options
        .map(x => ({ refpath: x, dist: x.split(path.sep).length }))
        .reduce(R.minBy(R.prop("dist")), { dist: Infinity }).refpath;
};

/**
 * Shortest edit distance between old and new paths.
 * Good for pluralization changes to folders
 */
const editDistance = (filename, refpath, options) => {
    return options
        .map(x => ({ refpath: x, editDist: calculateDistance(refpath, x) }))
        .reduce(R.minBy(R.prop("editDist")), { editDist: Infinity });
};

/**
 * Not really good for anything...
 */
const random = (filename, refpath, options) => {
    return resolveObj(filename, refpath, randomElem(options));
};

const randomElem = array => {
    if (!array || array.length === 0)
        throw new Error("empty array supplied to randomElem");
    return array[randomRange(0, array.length - 1)];
};

const randomRange = (lower, upper) => {
    return lower + Math.floor(Math.random() * (upper - lower + 1));
};

module.exports = {
    resolver,
    resolveObj,
    composeFirstTruthy,
    firstTruthyReducer,
    resolveValidation,
    first,
    closest,
    editDistance,
    random,
    randomElem,
    randomRange
};

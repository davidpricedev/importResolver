/**
 *
 * @param {any} config - the configuration object
 * @param {string} filename - the file containing the relative path
 * @param {string} path - a (relative) path found in the file
 * @param {string[]} options - list of locations that match the name of the file in the path
 */
const resolver = (config, filename, path, options) => {
    if (!options) throw new Error("you must supply options to the resolver");

    if (options.length === 1) return resolveObj(filename, path, options[0]);

    switch (config.resolveAlgo) {
        case "first":
            return first(filename, path, options);
        case "random":
            return random(filename, path, options);
        case "closest":
        case "rigthPath":
        case "minDistance":
        default:
            console.log("Unknown / not implemented resolver option.");
            return first(filename, path, options);
    }
};

const resolveObj = (filename, oldpath, newpath) => {
    return {
        filename,
        oldpath,
        newpath
    };
};

const first = (filename, path, options) => {
    return resolveObj(filename, path, options[0]);
};

const random = (filename, path, options) => {
    return resolveObj(filename, path, randomElem(options));
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
    first,
    random,
    randomElem,
    randomRange
};

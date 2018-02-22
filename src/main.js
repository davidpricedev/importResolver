const t = require("transducers-js");
const R = require("ramda");
const getConfig = require("./config").getConfig;
const path = require("path");
const getPotentialPaths = require("./parser").getPotentialPaths;
const util = require("./util");
const {
    getRefsFromFileContent,
    getAllFiles,
    getNpmFolders,
    getNpmBuiltins
} = util;

/**
 * Main overall processing function
 */
const run = () => {
    const config = getConfig();
    const allFiles = getAllFiles().filter(fileFilter(config));

    // special handling for various node modules is needed
    const npmFolders = [...getNpmFolders(), ...getNpmBuiltins()];

    // TODO:  Check Git Clean status here

    const checkPath = _checkPath(
        allFiles,
        npmFolders,
        config.missingExtensions
    );
    R.flatten(R.map(x => analyzeReferences(x, checkPath))(allFiles));
};

const fileFilter = config => filepath => {
    return (
        isEndInList(filepath)(config.fileType) &&
        !isStartInList(filepath)(config.exclude)
    );
};

/**
 * The `x => str.endsWith(x)` looks like it could be simplified to `str.endsWith`
 *  but str isn't capture effectively I think when that is attempted
 */
const isEndInList = str => R.any(R.flip(R.endsWith)(str));
const isStartInList = str => R.any(R.flip(R.startsWith)(str));

/**
 * Main processing function for a single file
 */
const analyzeReferences = (filename, checkPath) => {
    const allImportPaths = getRefsFromFile(filename);
    return t.into([], analyzeXform(checkPath(filename)), allImportPaths);
};

const analyzeXform = mapFn =>
    R.compose(t.map(mapFn), t.filter(R.complement(R.isNil)));

const getRefsFromFile = filename => {
    const fileContent = getRefsFromFileContent(filename);
    return getPotentialPaths(fileContent);
};

/**
 * Checks the given path found in the given filename
 *  - if the path exists, excellent nothing needs to be done
 *  - if the path doesn't exist, tries to find the location of the referenced file elsewhere in the tree
 *
 * Builds an object for each reference found in each file
 *  - other than those that already exist
 * That object may contain the info needed for search & replace
 *  or a message about why we are skipping it.
 *
 * @param {string[]} allFiles - all the source files to examine
 * @param {string[]} npmFolders - all the npm folders to ignore/rule-out
 * @param {string} filename - the file name we are working on now
 * @param {string} refpath - the import/require path we are working on now
 * @return {any} the array of objects containing the remappings
 */
const _checkPath = (allFiles, npmFolders, excludedExtensions) => (
    filename,
    refpath
) => {
    if (isNpmPath(npmFolders, refpath)) {
        return {
            filename,
            refpath,
            reason: "NPM",
            message: `[${filename}]: skipping ${refpath} - it is an npm module`
        };
    }

    const exists = doesFileExistWithExtnLookup(
        allFiles,
        excludedExtensions,
        getFullRelativePath(filename, refpath)
    );
    // no need to do anything
    // this is the default case, so we don't want to log anything.
    if (exists) return null;

    const fileMatches = findFilesWithMatchingNames(
        allFiles,
        excludedExtensions,
        path.basename(refpath)
    );
    if (!fileMatches || fileMatches.length === 0) {
        return {
            filename,
            refpath,
            reason: "NOT_FOUND",
            message: `[${filename}]: skipping ${refpath} - unable to find such a file`
        };
    }

    // future, find a way to resolve the multiple matches here
    return {
        filename,
        oldPath: refpath,
        reason: "RESOLVED",
        newPath: fileMatches[0]
    };
};

const getFullRelativePath = (filename, refpath) => {
    const fileDir = path.dirname(filename);
    const x = path.join(fileDir, refpath);
    console.log("full relative path: ", x);
    return path.join(fileDir, refpath);
};

const isNpmPath = (npms, refpath) => {
    // handle sub-nav into npm modules i.e. `import { put } from 'redux-saga/effects';`
    const firstPathPart = refpath.includes("/")
        ? refpath.split("/")[0]
        : refpath;
    if (firstPathPart === "." || firstPathPart === "..") return false;

    return R.any(R.eqBy(firstPathPart))(npms);
};

const endsWith = R.curry((str, end) => str.endsWith(`${end}`));

/**
 * Returns any of the elements in the search set that match the predicate.
 * The predicate must be curried and take two params, first the element
 * from the searchSet and second the element from the subset.
 * `superElem => subElem -> Boolean`
 */
const filterBySubset = (predicate, searchSet, subset) => {
    const filter = x => R.any(predicate(x))(subset);
    return R.filter(filter)(searchSet);
};

const getPotentialFileNames = (file, extns) =>
    R.map(R.concat(file))([...extns, ""]);

const findFilesWithMatchingNames = (allFiles, excludeExtns, filename) => {
    const potentials = getPotentialFileNames(filename, excludeExtns);
    return filterBySubset(endsWith, allFiles, potentials);
};

const doesFileExistWithExtnLookup = R.compose(
    R.lt(0),
    R.length,
    findFilesWithMatchingNames
);

module.exports = {
    isNpmPath,
    _checkPath,
    run,
    fileFilter,
    isEndInList,
    isStartInList,
    analyzeReferences,
    analyzeXform,
    doesFileExistWithExtnLookup,
    getPotentialFileNames,
    endsWith,
    filterBySubset,
    findFilesWithMatchingNames
};

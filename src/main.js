const R = require("ramda");
const getConfig = require("./config").getConfig;
const path = require("path");
const getPotentialPaths = require("./parser").getPotentialPaths;
const util = require("./util");
const { getFileContent, getAllFiles, getNpmFolders, getNpmBuiltins } = util;

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
    allFiles.forEach(x => processFile(x, checkPath));
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
const isEndInList = str => R.any(x => str.endsWith(x));
const isStartInList = str => R.any(x => str.startsWith(x));

/**
 * Main processing function for a single file
 */
const processFile = (filename, checkPath) => {
    const fileContent = getFileContent(filename);
    const allImportPaths = getPotentialPaths(fileContent);
    return R.flatten(R.map(checkPath(filename))(allImportPaths));
};

/**
 * Checks the given path found in the given filename
 *  - if the path exists, excellent nothing needs to be done
 *  - if the path doesn't exist, tries to find the location of the referenced file elsewhere in the tree
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
        console.log(`[${filename}]: skipping ${refpath} - it is an npm module`);
        return null;
    }

    console.log("passed the npmcheck: ", filename, refpath);
    const exists = doesFileExistWithExtnLookup(
        allFiles,
        excludedExtensions,
        getFullRelativePath(filename, refpath)
    );
    if (exists)
        console.log("failed the existence check", filename, refpath, exists);
    if (exists) return null; // no need to do anything

    console.log("passed the existence check: ", filename, refpath);
    const fileMatches = findFilesWithMatchingNames(
        allFiles,
        excludedExtensions,
        path.basename(refpath)
    );
    if (!fileMatches || fileMatches.length === 0) {
        console.log(
            `[${filename}]: skipping ${refpath} - unable to find such a file`
        );
        return null;
    }

    console.log("passed the lookup check: ", filename, refpath);
    /// future, find a way to resolve the multiple matches here
    //if (fileMatches && fileMatches.length === 1) {
    return {
        filename,
        oldPath: refpath,
        newPath: fileMatches[0]
    };
    //}
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
    processFile,
    doesFileExistWithExtnLookup,
    getPotentialFileNames,
    endsWith,
    filterBySubset,
    findFilesWithMatchingNames
};

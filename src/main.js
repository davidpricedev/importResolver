const { has, complement, ifElse, contains, merge, either } = require("ramda");
const getConfig = require("./config").getConfig;
const path = require("path");
const { getProcArgs, getAllNpms } = require("./io");
const { I } = require("./combinators");
const {
    getFullRelativePath,
    isNpmPath,
    findFilesWithMatchingNames,
    getProjectFiles,
    getRefsFromFile,
    doesFileExistWithExtnLookup,
    replaceContent,
} = require("./file");
const { resolve } = require("./resolve");

/************
 ** Dictionary:
 **  ref: reference to another file found in an import or require
 **  reference: general term for either import or require
 ************/

/*
type resolveObj = {
    filename: string, // the file
    oldPath: string, // old ref path
    newPath: string, // replacement ref path
    reason: string, // error or ok
    message: string, // error
}
*/

const run = () => {
    const args = getProcArgs();
    const config = getConfig(args);
    const allFiles = getProjectFiles();
    const allNpms = getAllNpms();

    const myRefExists = refExists(allFiles, config.excludedExtensions);
    const findPotentialSolutions = findPotentials(allFiles, config);
    const findBestSolution = resolveRef(allFiles, resolve(config));
    const myIsNpmPath = isNpmPath(allNpms);
    const execute = ifElse(isDryRun, display, applyChange)(args);

    allFiles
        // for each file
        .map(getBrokenRefs(myRefExists, myIsNpmPath))
        // unnest the list of lists
        .flatmap(I)
        // find potential solutions and add them to the object
        .map(x => x.concat(findPotentialSolutions))
        .map(x => x.concat(findBestSolution))
        // Apply the changes - actually make the replacements
        .map(execute);
};

const isDryRun = contains("--dry-run");

const getBrokenRefs = (doesExist, isNpm) => file =>
    getRefsFromFile(file)
        // skip if the reference exists or its an npm
        .filter(either(complement(doesExist), complement(isNpm)))
        // xform to obj
        .map(buildResolveObj(file));

const buildResolveObj = filename => oldPath => ({ filename, oldPath });

const refExists = (allFiles, excludedExtensions) => (filename, refpath) =>
    doesFileExistWithExtnLookup(
        allFiles,
        excludedExtensions,
        getFullRelativePath(filename, refpath)
    );

const findPotentials = (allFiles, config) => fileAndRef => ({
    potentials: findFilesWithMatchingNames(
        allFiles,
        config.excludedExtensions,
        path.basename(fileAndRef.refpath)
    ),
});

const resolveRef = (allFiles, resolver) => fileAndRef => {
    return merge(fileAndRef, resolver(fileAndRef));
};

const displayChange = x =>
    console.log(`[${x.filename}]:${x.oldPath} -> ${x.newPath}`);

const displayError = x =>
    console.log(`[${x.filename}]:${x.oldPath} ~ ${x.message}`);

const display = ifElse(has("message"), displayError, displayChange);

const applyChange = x => {
    replaceContent(x);
    display(x);
};

module.exports = {
    run,
    findPotentials,
    resolveRef,
    isDryRun,
    getBrokenRefs,
    buildResolveObj,
    refExists,
};

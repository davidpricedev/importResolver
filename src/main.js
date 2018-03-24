const {
    not,
    endsWith,
    complement,
    pipe,
    has,
    ifElse,
    prop,
    merge,
    both,
    contains,
} = require("ramda");
const getConfig = require("./config").getConfig;
const path = require("path");
const { doesFileExist, getProcArgs, getAllNpms } = require("./io");
const { List } = require("./adts");
const { I, invokeOn } = require("./combinators");
const {
    getFullRelativePath,
    isNpmPath,
    findFilesWithMatchingNames,
    getProjectFiles,
    getRefsFromFile,
    doesFileExistWithExtnLookup,
    doesFileExistWithExtnLookupRaw,
    replaceContent,
} = require("./file");
const { resolve } = require("./resolve");
const { observe, observePred, observeFull, observeFullPred } = require("./spy");

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

// TODO - pivot to running a file at a time instead of the whole batch at once
const run = () => {
    // TODO merge allFiles and allNpms into config
    // TODO read up on "Reader" to solve the config better
    const config = getConfig(getProcArgs());
    const allFiles = getProjectFiles(config);
    const allNpms = getAllNpms();

    const myRefExists = refExists(allFiles, config.missingExtensions);
    const myIsNpmPath = isNpmPath(allNpms);

    allFiles
        // for each file
        .map(getBrokenRefs(myRefExists, myIsNpmPath))
        // eliminate files we don't need to modify
        //.inspectItem("before filter")
        .filter(both(List.isList, invokeOn("isNonEmpty")))
        // unnest the list of lists
        //.inspectItem("afterfilter")
        .flatMap(I)
        .filter(pipe(prop("oldPath"), endsWith(".png"), not))
        .filter(pipe(prop("filename"), contains("Home")))
        // find potential solutions and add them to the object
        .map(x => merge(x, findPotentials(allFiles, config)(x)))
        //.inspectItem("beforebest")
        .map(x => merge(x, resolveRef(allFiles, resolve)(x)))
        // Apply the changes - actually make the replacements
        .map(applyOrDisplay(config));
};

const getBrokenRefs = (doesExist, isNpm) => filename =>
    List.of(getRefsFromFile(filename))
        .filter(complement(isNpm))
        .map(buildResolveObj(filename))
        .filter(complement(doesExist));

const buildResolveObj = filename => oldPath => ({
    filename,
    oldPath,
    fullOldPath: getFullRelativePath(filename, oldPath),
});

const refExistsRaw = excludedExtensions => refObj =>
    doesFileExistWithExtnLookupRaw(excludedExtensions, refObj.fullOldPath);

const refExists = (allFiles, excludedExtensions) => refObj =>
    doesFileExistWithExtnLookup(
        allFiles,
        excludedExtensions,
        prop("fullOldPath")(refObj)
    );

const findPotentials = (allFiles, config) => fileAndRef => ({
    potentials: observe(
        "pot",
        //contains("Home", fileAndRef.filename),
        findFilesWithMatchingNames
    )(allFiles, config.missingExtensions, path.basename(fileAndRef.oldPath)),
});

const resolveRef = (allFiles, resolver) => fileAndRef => {
    return merge(fileAndRef, resolver(fileAndRef));
};

const displayChange = x =>
    //console.log(`[${x.filename}]:${x.oldPath} -> ${x.newPath}`);
    console.log(`[${x.filename}]:${x.oldPath} -> `, JSON.stringify(x, null, 2));

const displayError = x =>
    console.log(`[${x.filename}]:${x.oldPath} ~ ${x.message}`);

const display = ifElse(has("message"), displayError, displayChange);

const applyChange = x => {
    replaceContent(x);
    display(x);
};

const applyOrDisplay = config =>
    prop("dryRun")(config) ? display : applyChange;

module.exports = {
    run,
    findPotentials,
    resolveRef,
    getBrokenRefs,
    buildResolveObj,
    refExists,
};

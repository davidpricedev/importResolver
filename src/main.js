const {
    defaultTo,
    complement,
    has,
    ifElse,
    prop,
    merge,
    both,
} = require("ramda");
const getConfig = require("./config").getConfig;
const path = require("path");
const { getProcArgs, getAllNpms } = require("./io");
const { List } = require("./adts");
const { I, K, invokeOn } = require("./combinators");
const {
    absoluteToRef,
    relativeToAbsolute,
    isNpmPath,
    findFilesWithMatchingNamesi,
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

// TODO - pivot to running a file at a time instead of the whole batch at once
const run = () => {
    console.log("Gathering project files");

    // TODO merge allFiles and allNpms into config
    // TODO read up on "Reader" to solve the config better
    const config = getConfig(getProcArgs());
    const allFiles = getProjectFiles(config);
    const allNpms = getAllNpms();

    const myRefExists = refExists(allFiles, config.missingExtensions);
    const myIsNpmPath = isNpmPath(allNpms);

    allFiles
        // for each file
        .log("Looking for broken references")
        .map(getBrokenRefs(myRefExists, myIsNpmPath))
        // eliminate files we don't need to modify
        .filter(both(List.isList, invokeOn("isNonEmpty")))
        // unnest the list of lists
        .flatMap(I)
        //.filter(pipe(prop("oldPath"), endsWith(".png"), not))
        //.filter(pipe(prop("filename"), contains("Home")))
        // find potential solutions and add them to the object
        .log("Looking for potential solutions")
        .map(applyAndMerge(findPotentials(allFiles, config)))
        // find the best options with a few algorithms
        .log("Looking for the best solution")
        .map(applyAndMerge(resolveRef(allFiles, resolve)))
        // Apply the changes - actually make the replacements
        .map(applyAndMerge(resultToRef(config)))
        .inspectItem("Full")
        .map(applyOrDisplay(config));
};

const applyAndMerge = f => x => merge(x, f(x));

const getBrokenRefs = (doesExist, isNpm) => filename =>
    List.of(getRefsFromFile(filename))
        .filter(complement(isNpm))
        .map(buildResolveObj(filename))
        .filter(complement(doesExist));

const buildResolveObj = filename => oldPath => ({
    filename,
    oldPath,
    fullOldPath: relativeToAbsolute(filename, oldPath),
});

const refExists = (allFiles, excludedExtensions) => refObj =>
    doesFileExistWithExtnLookup(
        allFiles,
        excludedExtensions,
        prop("fullOldPath")(refObj)
    );

const findPotentials = (allFiles, config) => fileAndRef => ({
    potentials: findFilesWithMatchingNamesi(
        allFiles,
        config.missingExtensions,
        path.basename(fileAndRef.oldPath)
    ),
});

const resolveRef = (allFiles, resolver) => fileAndRef => {
    return merge(fileAndRef, resolver(fileAndRef));
};

const { observe } = require("./spy");
const resultToRef = config => resolveObj => ({
    resultRef: observe("abs->rel", absoluteToRef)(
        prop("filename", resolveObj),
        getResult(config, resolveObj)
    ),
});

const getResult = (config, resolveObj) =>
    defaultTo("")(prop(config.resolveAlgo, resolveObj));

const displayChange = x => {
    console.log(`[${x.filename}]:\n\t${x.oldPath}\n\t -> ${x.resultRef}`);
};

const displayError = x =>
    console.log(`[${x.filename}]:\n\t${x.oldPath} ~ ${x.message}`);

const display = ifElse(has("message"), displayError, displayChange);

const applyChange = x => {
    replaceContent(x);
    display(x);
};

const applyOrDisplay = ifElse(prop("dryRun"), K(display), K(applyChange));

module.exports = {
    run,
    findPotentials,
    resolveRef,
    getBrokenRefs,
    buildResolveObj,
    refExists,
};

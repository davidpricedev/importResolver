const {
    head,
    any,
    flip,
    endsWith,
    startsWith,
    eqBy,
    split,
    innerJoin,
    concat,
    either,
    equals,
    complement,
    contains,
    pipe,
    defaultTo,
} = require("ramda");
//const { isString, isObject } = require("ramda-adjunct");
const { Maybe, List, reduceOr } = require("./adts");
const path = require("path");
const {
    getRegex,
    stripCwd,
    readFile,
    writeFile,
    getAllFiles,
    doesFileExist,
} = require("./io");
const { observe, observePred, observeFull, observeFullPred } = require("./spy");
const { getRefsFromFileContent } = require("./parser");
const { I, allTrue } = require("./combinators");

const getProjectFiles = config =>
    List.of(getAllFiles(".")).filter(_fileFilter(config));

// TODO: better glob/include/exclude handling
const _fileFilter = config =>
    pipe(
        stripCwd,
        allTrue(
            //either(contains("Home"), contains("AppHeader")),
            _isEndInList(config.fileTypes),
            complement(_isStartInList(config.exclude))
        )
    );

// searchString => list => Boolean
const _isEndInList = ends => str =>
    List.of(ends)
        .map(flip(endsWith)(str))
        .reduce(reduceOr, false);
const _isStartInList = starts => str =>
    List.of(starts)
        .map(x => startsWith(x, str))
        .reduce(reduceOr, false);

const getFullRelativePath = (filename, refpath) => {
    if (!refpath) return "";
    return path.join(path.dirname(filename), refpath);
};

const isNpmPath = allNpms => refpath => {
    if (!refpath) return false;

    // handle sub-nav into npm modules i.e. `import ... from 'redux-saga/effects';`
    const firstPathPart = head(split("/", refpath));

    // Assume relative paths are never npms
    if (firstPathPart.startsWith(".") && !contains("node_modules", refpath))
        return false;

    return any(eqBy(firstPathPart))(allNpms);
};

const doesFileExistWithExtnLookupRaw = (excludedExtns, filename) =>
    List.of(_getPotentialFileNames(filename, excludedExtns))
        .filter(doesFileExist)
        .isNonEmpty();

const doesFileExistWithExtnLookup = (...args) =>
    findFilesWithMatchingNames.apply(this, args).isNonEmpty();

const findFilesWithMatchingNames = (allFiles, excludedExtns, filename) =>
    Maybe.Some(_getPotentialFileNames(filename, excludedExtns))
        .map(_getExisting(allFiles))
        .toList();

// NOT working for real-world examples
const _getExistingX = allFiles => potentials =>
    observe("_getExisting", innerJoin(flip(endsWith), allFiles, potentials));
const _getExisting = allFiles => potentials => {
    return innerJoin(flip(endsWith), List.toArray(allFiles), potentials);
};

const _getPotentialFileNames = (filename, extns) =>
    _rawExtensions(extns)
        .concat(_indexExtensions(extns) || List.of([]))
        .map(concat(defaultTo("", filename)))
        .toArray();

// import and require allow dropping file extensions
const _rawExtensions = extns => List.of([""]).concat(defaultTo([], extns));

// import and require also allow a folder name - containing an index file
const _indexExtensions = extns => _rawExtensions(extns).map(concat("/index"));

const getRefsFromFile = filename => getRefsFromFileContent(readFile(filename));

const replaceContent = resolveObj => {
    const rawOrigContent = readFile(resolveObj.filename);
    Maybe.fromString(rawOrigContent)
        //.inspect("content cant be empty")
        .map(_replaceAll(resolveObj.searchString, resolveObj.replaceString))
        .fold(I, writeFile(resolveObj.filename));
};

const _replaceAll = (searchStr, replaceStr) => str =>
    str.replace(stringToRegex(searchStr), replaceStr);

const stringToRegex = searchStr => getRegex(_escapeRegExp(searchStr), "g");

/**
 * borrowed from https://stackoverflow.com/a/17606289/567493
 */
const _escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
    getFullRelativePath,
    _fileFilter,
    isNpmPath,
    _isEndInList,
    _isStartInList,
    findFilesWithMatchingNames,
    _getPotentialFileNames,
    _getExisting,
    getRefsFromFile,
    getProjectFiles,
    doesFileExistWithExtnLookup,
    doesFileExistWithExtnLookupRaw,
    replaceContent,
    _replaceAll,
};

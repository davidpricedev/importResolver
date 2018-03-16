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
    map,
    both,
    complement,
} = require("ramda");
const { List, reduceOr } = require("./adts");
const path = require("path");
const { readFile, writeFile, getAllFiles } = require("./io");
const { getRefsFromFileContent } = require("./parser");
const { pipe } = require("./combinators");

const getProjectFiles = config =>
    List.of(getAllFiles(".")).filter(_fileFilter(config));

// TODO: better glob/include/exclude handling
const _fileFilter = config =>
    both(
        _isEndInList(config.fileTypes),
        complement(_isStartInList(config.exclude))
    );

// searchString => list => Boolean
const _isEndInList = ends => str =>
    List.of(ends)
        .map(flip(endsWith)(str))
        .reduce(reduceOr, false);
const _isStartInList = starts => str =>
    List.of(starts)
        .map(flip(startsWith)(str))
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
    if (firstPathPart.startsWith(".")) return false;

    return any(eqBy(firstPathPart))(allNpms);
};

const findFilesWithMatchingNames = (allFiles, excludeExtns, filename) => {
    const potentials = _getPotentialFileNames(filename, excludeExtns);
    return List.of(innerJoin(flip(endsWith), allFiles, potentials));
};

const _getPotentialFileNames = (file, extns) =>
    map(concat(file))(concat(extns, [""]));

const getRefsFromFile = pipe(readFile, getRefsFromFileContent);

const doesFileExistWithExtnLookup = (...args) =>
    findFilesWithMatchingNames(...args)
        .inspect()
        .isNonEmpty();

const replaceContent = resolveObj =>
    pipe(
        readFile(resolveObj.filename),
        _replaceAll(resolveObj.searchString, resolveObj.replaceString),
        writeFile(resolveObj.filename)
    );

/**
 * borrowed from https://stackoverflow.com/a/17606289/567493
 */
const _escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const _replaceAll = (searchStr, replaceStr) => str =>
    str.replace(new RegExp(_escapeRegExp(searchStr), "g"), replaceStr);

module.exports = {
    getFullRelativePath,
    _fileFilter,
    isNpmPath,
    _isEndInList,
    _isStartInList,
    findFilesWithMatchingNames,
    _getPotentialFileNames,
    getRefsFromFile,
    getProjectFiles,
    doesFileExistWithExtnLookup,
    replaceContent,
    _replaceAll,
};

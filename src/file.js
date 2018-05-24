const {
  ifElse,
  toLower,
  take,
  head,
  any,
  flip,
  endsWith,
  startsWith,
  eqBy,
  split,
  innerJoin,
  concat,
  complement,
  contains,
  pipe,
  defaultTo,
  lastIndexOf,
  replace,
} = require('ramda');
const { Maybe, List, reduceOr } = require('./adts');
const path = require('path');
const {
  getRegex,
  stripCwd,
  readFile,
  writeFile,
  getAllFiles,
  doesFileExist,
} = require('./io');
const { getRefsFromFileContent } = require('./parser');
const { WB, I, allTrue } = require('./combinators');

const getProjectFiles = config => {
  const allFiles = List.of(getAllFiles('.'));
  console.log('raw file count: ', allFiles.length());
  return allFiles.filter(_fileFilter(config));
};

// TODO: better glob/include/exclude handling
const _fileFilter = config =>
  pipe(
    stripCwd,
    allTrue(
      _isEndInList(config.fileTypes),
      complement(_isStartInList(config.exclude))
    )
  );

const _isEndInList = ends => str =>
  List.of(ends)
    .map(flip(endsWith)(str))
    .reduce(reduceOr, false);
const _isStartInList = starts => str =>
  List.of(starts)
    .map(x => startsWith(x, str))
    .reduce(reduceOr, false);

const relativeToAbsolute = (relativeToFile, relpath) => {
  if (!relpath) return '';
  return path.join(path.dirname(relativeToFile), relpath);
};

const absoluteToRef = (relativeToFile, abspath) => {
  const relpathWithExtn = absoluteToRelative(relativeToFile, abspath);
  return pipe(stripExtension, stripIndex, addHerePath)(relpathWithExtn);
};

const absoluteToRelative = (relativeToFile, abspath) => {
  if (!abspath) return '';
  return path.relative(path.dirname(relativeToFile), abspath);
};

/*
overly complex version
const stripExtension = config => filename => {
    const extn = List.of(config.missingExtensions)
        .map(ifElse(flip(endsWith)(filename), I, K(false)))
        .reduce(reduceOr);
    return filename.replace(extn, "");
};
*/

//const takeUntil = untilChar => str => take(lastIndexOf(untilChar)(str))(str);
const takeUntilLast = untilChar => WB(take)(lastIndexOf(untilChar));

const stripExtension = takeUntilLast('.');
const stripIndex = takeUntilLast('/index');

const addHerePath = ifElse(startsWith('.'), I, concat('./'));

const isNpmPath = allNpms => refpath => {
  if (!refpath) return false;

  // handle sub-nav into npm modules i.e. `import ... from 'redux-saga/effects';`
  const firstPathPart = head(split('/', refpath));

  if (firstPathPart.startsWith('.') && !contains('node_modules', refpath))
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

const _getExisting = allFiles => potentials => {
  return innerJoin(flip(endsWith), List.toArray(allFiles), potentials);
};

const findFilesWithMatchingNamesi = (allFiles, excludedExtns, filename) =>
  Maybe.Some(_getPotentialFileNames(filename, excludedExtns))
    .map(_getExistingi(allFiles))
    .toList();

const endsWithi = (str = '', ending = '') =>
  endsWith(toLower(ending), toLower(str));

const _getExistingi = allFiles => potentials => {
  return innerJoin(endsWithi, List.toArray(allFiles), potentials);
};

const _getPotentialFileNames = (filename, extns) =>
  _rawExtensions(extns)
    .concat(_indexExtensions(extns) || List.of([]))
    .map(concat(defaultTo('', filename)))
    .toArray();

// import and require allow dropping file extensions
const _rawExtensions = extns => List.of(['']).concat(defaultTo([], extns));

// import and require also allow a folder name - containing an index file
const _indexExtensions = extns => _rawExtensions(extns).map(concat('/index'));

const getRefsFromFile = filename => getRefsFromFileContent(readFile(filename));

const replaceContent = resolveObj => {
  const rawOrigContent = readFile(resolveObj.filename);
  Maybe.fromString(rawOrigContent)
    .map(_replaceAll(resolveObj.oldPath, resolveObj.resultRef))
    .fold(I, writeFile(resolveObj.filename));
};

const _replaceAll = (searchStr, replaceStr) =>
  replace(stringToRegex(searchStr), replaceStr);

const stringToRegex = searchStr => getRegex(_escapeRegExp(searchStr), 'g');

/**
 * borrowed from https://stackoverflow.com/a/17606289/567493
 */
const _escapeRegExp = replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  relativeToAbsolute,
  absoluteToRef,
  absoluteToRelative,
  takeUntilLast,
  endsWithi,
  _fileFilter,
  isNpmPath,
  _isEndInList,
  _isStartInList,
  findFilesWithMatchingNames,
  findFilesWithMatchingNamesi,
  _getPotentialFileNames,
  _getExisting,
  _getExistingi,
  getRefsFromFile,
  getProjectFiles,
  doesFileExistWithExtnLookup,
  doesFileExistWithExtnLookupRaw,
  replaceContent,
  _replaceAll,
};

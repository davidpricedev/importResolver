const {
    pipe,
    curry,
    set,
    lensProp,
    split,
    minBy,
    prop,
    objOf,
    add,
    multiply,
    subtract,
    merge,
} = require("ramda");
const dirPath = require("path");
const { calculateDistance } = require("./editDistance");
const { T } = require("./combinators");
const { List, Maybe } = require("./adts");

const resolve = fileAndRef => {
    return List.of(algorithms())
        .map(T(resolveValidation(fileAndRef)))
        .reduce(merge);
};

const algorithms = () => [first, random, closest, editDistance];

const resolveValidation = fileAndRef => {
    if (!isValid(fileAndRef)) {
        const defaultObj = { potentials: List.of(), oldPath: "" };
        return Maybe.None(merge(defaultObj, fileAndRef));
    }

    return Maybe.Some(fileAndRef);
};

const isValid = fileAndRef =>
    fileAndRef.potentials &&
    List.isList(fileAndRef.potentials) &&
    fileAndRef.potentials.isNonEmpty() &&
    fileAndRef.oldPath;

/**
 * Not really any better than random...
 */
const first = fileAndRef => objOf("first", _getFirst(fileAndRef));

const _getFirst = fileAndRef =>
    fileAndRef
        .fold()
        .potentials.maybeHead()
        .fold();
const closestMap = x => pipe(setrefpath(x), setPathDist(x))({});
const setrefpath = set(lensProp("refpath"));
const calcPathDistance = pipe(split(dirPath.sep), prop("length"));
const setPathDist = pipe(calcPathDistance, set(lensProp("pathDist")));

/**
 * Shortest distance between the file and the refpath option.
 * Good for converting to better app-like organization structure
 *  (where apart from common utils, files should be close to the files they reference).
 */
const closest = fileAndRef => objOf("closest", _getClosest(fileAndRef));

const _getClosest = fileAndRef =>
    fileAndRef
        .fold()
        .potentials.map(closestMap)
        .reduce(minBy(prop("pathDist")), objOf("pathDist", Infinity)).refpath;

/**
 * Shortest edit distance between old and new paths.
 * Good for pluralization changes to folders
 */
const editDistance = fileAndRef =>
    objOf("minDistance", _getEditDistance(fileAndRef));

const _getEditDistance = fileAndRef =>
    fileAndRef
        .fold()
        .potentials.map(editDistMap(fileAndRef.fold().oldPath))
        .reduce(minBy(prop("minDistance")), objOf("minDistance", Infinity))
        .refpath;

const editDistMap = oldPath => x =>
    pipe(setrefpath(x), setEditDist(oldPath)(x))({});
const setEditDist = oldPath =>
    pipe(calculateDistance(oldPath), set(lensProp("minDistance")));

/**
 * Not really good for anything...
 */
const random = fileAndRef =>
    objOf("random", randomElem(fileAndRef.fold().potentials));

const randomElem = list => list.maybeNth(randomRange(0, list.length())).fold();

const randomRange = (lower, upper) => toRange(lower, upper, Math.random());

const toRange = curry((lower, upper, seed) =>
    add(lower, Math.floor(multiply(subtract(upper, lower), seed)))
);

module.exports = {
    resolve,
    resolveValidation,
    first,
    closest,
    editDistance,
    random,
    randomElem,
    randomRange,
};

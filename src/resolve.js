const {
    nth,
    pipe,
    curry,
    isEmpty,
    head,
    map,
    set,
    lensProp,
    reduce,
    split,
    minBy,
    prop,
    objOf,
    add,
    multiply,
    subtract,
    merge,
    evolve,
} = require("ramda");
const dirPath = require("path");
const { calculateDistance } = require("./editDistance");
const { T } = require("./combinators");
const { List, Maybe } = require("./adts");

const singleOr = (...Fns) =>
    pipe(
        evolve({ potentials: x => x.fromArray() }),
        composeFirstTruthy(resolveValidation, ...Fns)
    );

/**
 * Represents a potential solution to the broken reference
 */
const solutionObj = (fileAndRef, solution) => {
    if (!solution) return notFoundObj(fileAndRef);
    return merge(fileAndRef, { newPath: solution });
};

const notFoundObj = fileAndRef =>
    merge(fileAndRef, { message: "unable to find such a file" });

/**
 * Takes a list of functions and a set of arguments to be applied to those functions.
 * Runs through the list and returns the first truthy value returned from a function.
 * @param {functions[]} Fns
 * @param {any} args
 */
const composeFirstTruthy = (...Fns) =>
    curry((...args) => Fns.reduce(firstTruthyReducer(...args), null));

const firstTruthyReducer = (...args) => (a, x) => (a ? a : x(...args));

const isValid = fileAndRef =>
    fileAndRef.potentials &&
    List.isList(fileAndRef.potentials) &&
    fileAndRef.potentials.isNonEmpty() &&
    fileAndRef.oldPath;

const resolveValidation = fileAndRef => {
    if (!isValid(fileAndRef)) {
        console.log("empty potentials: ", fileAndRef);
        //throw new Error("you must supply potentials");
        const defaultObj = { potentials: List.of(), oldPath: "" };
        return Maybe.None(merge(defaultObj, fileAndRef));
    }

    return Maybe.Some(fileAndRef);
    //if (equals(1, path(["potentials", "length"], fileAndRef)))
    //return solutionObj(fileAndRef, fileAndRef.potentials[0]);
};

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
        .potentials.inspectItem("closest")
        .map(closestMap)
        .inspectItem("closest2")
        .reduce(minBy(prop("pathDist")), objOf("pathDist", Infinity)).refpath;

/**
 * Shortest edit distance between old and new paths.
 * Good for pluralization changes to folders
 */
const editDistance = fileAndRef =>
    objOf("editDist", _getEditDistance(fileAndRef));

const _getEditDistance = fileAndRef =>
    fileAndRef
        .fold()
        .potentials.map(editDistMap(fileAndRef.fold().oldPath))
        .inspectItem("editdist")
        .reduce(minBy(prop("editDist")), objOf("editDist", Infinity)).refpath;

const editDistMap = oldPath => x =>
    pipe(setrefpath(x), setEditDist(oldPath)(x))({});
const setEditDist = oldPath =>
    pipe(calculateDistance(oldPath), set(lensProp("editDist")));

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

const algorithms = () => [first, random, closest, editDistance];

const resolve = fileAndRef => {
    return List.of(algorithms())
        .map(T(resolveValidation(fileAndRef)))
        .reduce(merge);
};

/**
 * Returns the resolvor function that should be used based on the config algorithm.
 * @param {any} config - the configuration object
 * @param {FileAndRef} fileAndRef - the object containing the info needed to resolve
 * TODO: provide a weighted combination that takes all of it into account
 *
const resolve = pipe(
    prop("resolveAlgo"),
    cond([
        [equals("first"), singleOr(first)],
        [equals("random"), singleOr(random)],
        [equals("closest"), singleOr(closest)],
        [equals("editDistance"), singleOr(editDistance)],
        [T, singleOr(() => console.log("Unknown resolver option"), first)],
    ])
);
*/

module.exports = {
    resolve,
    solutionObj,
    notFoundObj,
    composeFirstTruthy,
    firstTruthyReducer,
    resolveValidation,
    first,
    closest,
    editDistance,
    random,
    randomElem,
    randomRange,
};

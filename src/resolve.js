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
    T,
    merge,
    evolve,
} = require("ramda");
const dirPath = require("path");
const { calculateDistance } = require("./editDistance");
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
    !isEmpty(fileAndRef.potentials) &&
    fileAndRef.oldPath;

const resolveValidation = fileAndRef => {
    if (!isValid(fileAndRef)) {
        console.log("empty potentials: ", fileAndRef);
        //throw new Error("you must supply potentials");
        const defaultObj = { potentials: [], oldPath: "" };
        return Maybe.None(merge(defaultObj, fileAndRef));
    }

    return Maybe.Some(fileAndRef);
    //if (equals(1, path(["potentials", "length"], fileAndRef)))
    //return solutionObj(fileAndRef, fileAndRef.potentials[0]);
};

/**
 * Not really any better than random...
 */
const first = resolveObj => {
    return merge(resolveObj, { first: head(resolveObj.potentials) });
};

const closestMap = x => pipe(setrefpath(x), setPathDist(x))({});
const setrefpath = set(lensProp("refpath"));
const calcPathDistance = pipe(split(dirPath.sep), prop("length"));
const setPathDist = pipe(calcPathDistance, set(lensProp("pathDist")));
const reduceToMinBy = x => reduce(minBy(prop(x)), objOf(x, Infinity));

/**
 * Shortest distance between the file and the refpath option.
 * Good for converting to better app-like organization structure
 *  (where apart from common utils, files should be close to the files they reference).
 */
const closest = pipe(
    prop("potentials"),
    map(closestMap),
    reduceToMinBy("pathDist"),
    prop("refpath")
);

/**
 * Shortest edit distance between old and new paths.
 * Good for pluralization changes to folders
 */
const editDistance = fileAndRef => {
    return pipe(
        map(editDistMap(fileAndRef.oldPath)),
        reduceToMinBy("editDist"),
        prop("refpath")
    );
};

const editDistMap = oldPath => x =>
    pipe(setrefpath(x), setEditDist(oldPath)(x))({});
const setEditDist = oldPath =>
    pipe(calculateDistance(oldPath), set(lensProp("editDist")));

/**
 * Not really good for anything...
 */
const random = fileAndRef => {
    return merge(fileAndRef, { random: randomElem(fileAndRef.potentials) });
};

const randomElem = array => nth(randomRange(0, array.length - 1))(array);

const randomRange = (lower, upper) => toRange(lower, upper, Math.random());

const toRange = curry((lower, upper, seed) =>
    add(lower, Math.floor(multiply(add(1, subtract(upper, lower)), seed)))
);

//const algorithms = () => [first, random, closest, editDistance];
const algorithms = () => [first, random];

const resolve = fileAndRef => {
    List.of(algorithms)
        //.inspect()
        .map(T(resolveValidation(fileAndRef)));
    //.inspect();
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

/***********
 * transducer functions (https://egghead.io/lessons/javascript-create-map-and-filter-transducers)
 * TODO: handle more es6 types (Set, Map)
 *
 * Dictionary:
 * transforms - functions that transform (filter/map/etc.) values in some way
 * step - function that provides the inner-most combination for a reducer
 *        (example: `(accumulator, x) => (accumulator.push(x)` for arrarys)
 * init - the initial or default value (often `[]` or `{}`)
 * transducer - function that orchestrates running transforms against a collection
 **********/
const R = require("ramda");
const transduceInit = "@@transduce/init";
const transduceStep = "@@transduce/step";

/**
 * Convenience function to create a map-like transform
 *  based on a mapping function
 */
const map = Fn => reducer => (accumulator, x) => reducer(accumulator, Fn(x));

/**
 * Convenience function to create a filter-like transform
 *  based on a predicate function
 */
const filter = Fn => reducer => (accumulator, x) => {
    if (!Fn(x)) return accumulator;
    return reducer(accumulator, x);
};

const appendStep = R.flip(R.append);

const objectStep = Object.assign;

const isPlainObject = x => R.type === "Object" && getType(x) === "";

//const isTransduceable = x => !!x[transduceInit] && !!x[transduceStep];

/*
const transduceConfig = {
    Object: {
        is: R.both(isType("Object"), isPlainObject),
        init: {},
        step: objectStep
    },
    Array: {
        is: isType("Array"),
        init: [],
        step: appendStep
    },
    CustomTransducable: {
        is: isTransduceable,
        init: x => x[transduceInit],
        step: x => x[transduceStep]
    }
};
*/
const objectIterator = function*(data) {
    const keys = Object.keys(data);
    for (const k of keys) {
        yield { [k]: data[k] };
    }
};

// Examines one key/value pair at a time.
// May be possible to use the objectIterator with ramda's transducer?
const objTransduce = (xf, reducer, dflt, data) => {
    if (isPlainObject(dflt)) return data;

    let accumulator = dflt;
    for (const kv of objectIterator(data)) {
        accumulator = xf(reducer(accumulator, kv));
    }

    return accumulator;
};

// into
/**
 * wraps transduce.
 * derives the step function based on the provided default value
 */
const transduce = R.curry((dflt, xf, data) => {
    if (isPlainObject(data)) return objTransduce(xf, objectStep, dflt, data);

    return R.transduce(xf, appendStep, dflt, data);
});

/**
 * wraps transduce.
 * dervices the step function and default value based on the type of collection data
 * curry'ed
 */
const seq = (...xf) => data => {
    if (R.type(data) === "Object") return transduce({}, R.compose(...xf), data);

    return transduce([], R.compose(...xf), data);
};

const td = {
    xform: map,
    where: filter,
    transduce,
    seq
};
//export const transduce = (combinerFn, transducerFn, dflt, data)
// transduce(pushReducer, R.pipe(td.where(isEven), td.select(double)), [], [1,2,3,4,5,6,7,8]);
// R.transduce(R.pipe(), appendReducer, [], data);

//[1, 2, 3, 4, 5, 6, 7, 8] => [4, 8, 12, 16]

const isEven = x => x % 2 === 0;
const double = x => 2 * x;

const doubleEvens = td.seq(td.where(isEven), td.xform(double));
doubleEvens([1, 2, 3, 4, 5, 6, 7, 8]); // => [4, 8, 12, 16]

//const reducerConcat = Fn => (accumulator, x) => accumulator.concat(Fn(x));
//const concat = Fn => R.reduce(reducerConcat(Fn), []);

module.exports = {
    isType,
    getType
};

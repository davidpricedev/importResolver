const { uniq, concat, equals, complement } = require("ramda");
const { isArray } = require("ramda-adjunct");
const { inspect } = require("./io");
const { I, K } = require("./combinators");

/**
 * Provides a light-weight monadal-like wrapper for arrays
 */
const _List = x => ({
    _isList: () => true,
    concat: l => {
        if (!l || !l.fold) console.log("ins", x, l);
        return _List(concat(x, l.fold()));
    },
    map: f => _List(x.map(f)),
    reduce: (f, dflt) => x.reduce(f, dflt),
    length: () => x.length,
    isEmpty: () => equals(0)(x.length),
    isNonEmpty: () => complement(equals(0))(x.length),
    fold: (dflt = K([]), xform = I) => (x ? xform(x) : dflt()),
    unique: () => _List(uniq(x)),
    toArray: () => x,
    inspect: () => {
        inspect("MyList")(x);
        return _List(x);
    },
});

const List = {
    of: x => {
        if (!x) return _List([]);
        if (!isArray) return _List([x]);
        return _List(x);
    },
};
List.fromArray = List.of;

const reduceOr = (a, b) => a || b;
const reduceAnd = (a, b) => a && b;

module.exports = {
    List,
    reduceAnd,
    reduceOr,
};

const {
    both,
    ifElse,
    uniq,
    concat,
    equals,
    complement,
    head,
    last,
    merge,
    join,
    has,
    cond,
    not,
} = require("ramda");
const { isTruthy, isArray, isObject, isString } = require("ramda-adjunct");
const { inspect } = require("./spy");
const { I, K, invokeOn } = require("./combinators");

const _isList = x => both(has("_isList"), invokeOn("_isList"))(x);
const toArray = ifElse(isArray, I, x => [x]);
const _unnest = cond([[isArray, I], [_isList, invokeOn("fold")], [K(true), I]]);

const flatMapReducer = (a, x) => concat(toArray(a), toArray(x));
const reduceOr = (a, b) => a || b;
const reduceAnd = (a, b) => a && b;
const reduceObj = (a, b) => merge(a, b);

/**
 * Provides a light-weight monad-like wrapper for arrays
 */
const _List = x => ({
    _value: x,
    _isList: () => true,
    concat: y => _List(concat(x, _isList(y) ? y._value : y)),
    flatMap: () => _List(x.map(_unnest).reduce(flatMapReducer, [])),
    map: f => _List(x.map(f)),
    filter: p => _List(x.filter(p)),
    reduce: (f, dflt) => x.reduce(f, dflt),
    length: () => x.length,
    isEmpty: () => equals(0)(x.length),
    isNonEmpty: () => complement(equals(0))(x.length),
    fold: (f = K([]), g = I) => (x ? g(x) : f()),
    unique: () => _List(uniq(x)),
    slice: (i, j) => _List(x.slice(i, j)),
    toArray: () => x,
    maybeHead: () => Maybe.fromFalsible(head(x)),
    maybeLast: () => Maybe.fromFalsible(last(x)),
    inspect: prefix => {
        console.log(mergeText("List", `(${prefix})`), x);
        return _List(x);
    },
    inspectPred: (prefix, pred) => {
        if (!pred(x)) return _List(x);

        console.log(mergeText("List", `(${prefix})`), x);
        return _List(x);
    },
    toMaybe: () => (x ? Maybe.Some(x) : Maybe.None()),
});

const _arrayToList = cond([
    [not, K(_List([]))],
    [complement(isArray), x => _List([x])],
    [K(true), _List],
]);

const List = {
    of: _arrayToList,
    fromArray: _arrayToList,
    isList: _isList,
    toArray: x => (_isList(x) ? x.toArray() : x),
};

const mergeText = (a, b) => join(" ")([a, b]);

const _Some = x => ({
    _value: x,
    map: f => _Some(f(x)),
    concat: y => {
        if (isObject(x) && isObject(y._value)) {
            return _Some(merge(x, y));
        } else if (isString(x) || isString(y._value)) {
            return _Some(`${x}${y._value}`);
        }
    },
    fold: (f, g = I) => g(x),
    coalesce: (f, g = I) => _Some(g(x)),
    toList: () => List.of(x || []),
    inspect: prefix => {
        inspect(mergeText("Some", prefix))(x);
        return _Some(x);
    },
    inspectPred: (prefix, pred) => {
        if (pred(x)) {
            inspect(mergeText("List", prefix))(x);
        }

        return _Some(x);
    },
});

const _None = x => ({
    map: () => _None(x),
    fold: f => f(x),
    coalesce: f => _Some(f(x)),
    toList: () => List.of([]),
    inspect: prefix => {
        inspect(mergeText("None", prefix))(x);
        return _None(x);
    },
    inspectPred: (prefix, pred) => {
        if (pred(x)) {
            inspect(mergeText("List", prefix))(x);
        }

        return _None(x);
    },
});

const myIsString = both(isTruthy, both(isString, complement(isObject)));
const stringToMaybe = ifElse(myIsString, _Some, _None);

const Maybe = {
    fromNullable: x => (x === null ? _None(x) : _Some(x)),
    fromFalsible: x => (x ? _Some(x) : _None(x)),
    fromString: stringToMaybe,
    None: x => _None(x),
    Some: x => _Some(x),
};

module.exports = {
    List,
    Maybe,
    reduceAnd,
    reduceOr,
    reduceObj,
    flatMapReducer,
    myIsString,
    _arrayToList,
    _isList,
    _unnest,
};

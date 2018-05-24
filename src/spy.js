const { both, has, map, cond } = require('ramda');
const { isArray, isFunction, isObject } = require('ramda-adjunct');

/***********************************************
 * Functional Programming leads to structures that are moderately more complex to console.log
 *  to see what is happening.
 * This file contains a bunch of helper functions that make things much easier to spy on
 **********************************************/

/**
 * Acts as the identity function with a console.log side effect,
 *  throws the prefix on the beginning of the console.log output
 */
const inspectItem = prefix => x => {
  console.log(`inspectItem: ${prefix}: `, x);
  return x;
};

/**
 * Wrap observe around any function to log the args and result of the function
 * @param {string} prefix - prefix string
 * @param {x => string} format - formatting function applied to args and result
 * @param {args => boolean} pred - the predicate to run against any args
 * @param {Function} f - the function to wrap
 * Example: `observe("mult", multiply)(3, 5)`
 *  prints `[mult] multiply( [3, 5] ) -> 15`
 */
const _observe = (prefix, format, pred, f) => (...args) => {
  const result = f.apply(this, args);
  if (pred.apply(this, args)) {
    console.log(
      `[${prefix}] ${f.name}(`,
      map(format, args),
      ') -> ',
      format(result)
    );
  }

  return result;
};

const I = x => x;
const K = x => () => x;
const observe = (prefix, f) => _observe(prefix, printArg, K(true), f);
const observePred = (prefix, pred, f) => _observe(prefix, printArg, pred, f);
const observeFull = (prefix, f) => _observe(prefix, I, K(true), f);
const observeFullPred = (prefix, pred, f) => _observe(prefix, I, pred, f);

// reimplement to avoid circular dependency on adts
const _isList = both(has('_isList'), y => y._isList());

const printArg = cond([
  [isArray, x => `[..${x.length}..]`],
  [isFunction, x => `${x.name} (${x.length}-ary) => {}`],
  [_isList, x => `${x.slice(0, 20).toArray()}`],
  [isObject, x => `{..${Object.keys(x)}..}`],
  [() => true, x => x],
]);

module.exports = {
  inspectItem,
  observe,
  observePred,
  observeFull,
  observeFullPred,
};

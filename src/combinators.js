const { inspectItem } = require('./spy');
const { has, pipe, both } = require('ramda');

// Standard (borrowed from https://gist.github.com/Avaq/1f0636ec5c8d6aed2e45)
const I = x => x;
const K = x => () => x;
const A = f => x => f(x);
const T = x => f => f(x);
const W = f => x => f(x)(x);
const C = f => y => x => f(x)(y);
const B = f => g => x => f(g(x));
const S = f => g => x => f(x)(g(x));
const P = f => g => x => y => f(g(x))(g(y));
const Y = f => (g => g(g))(g => f(x => g(g)(x)));

// ============== mine ==================

/**
 * invoke the fstr method on x with any provided arguments - a tacit/point-free converter
 * JSON.stringify(myObj) -> invokeOn("stringify", myObj)(JSON)
 */
const invokeOn = (fstr, ...args) => x => {
  if (!x || !has(fstr, x))
    throw new Error(fstr + ' not found on the ' + typeof x + ' object ' + x);

  return x[fstr].apply(x, args);
};

/**
 *  A mashup of the W and B converters
 */
const WB = f => g => x => f(g(x))(x);

/**
 * This is an n-ary version of ramda's both function
 */
const allTrue = (...fns) =>
  fns.reduce((f, g) => {
    if (typeof f !== 'function') {
      inspectItem('f is not a function')(f);
      throw new Error('f is not a function! ' + f.toString());
    }
    if (typeof g !== 'function') {
      inspectItem('g is not a function')(g);
      throw new Error('g is not a function! ' + Object.keys(g));
    }
    return both(f, g);
  });

module.exports = {
  I,
  K,
  A,
  T,
  W,
  C,
  B,
  S,
  P,
  Y,
  WB,
  pipe,
  invokeOn,
  allTrue,
};

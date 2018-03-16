const { inspect } = require("./io.js");

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

// mine
const wDeep = f => g => x => f(g(x))(x);
const pipe = (...args) =>
    args.reduce((f, g) => {
        if (typeof f !== "function") {
            inspect("f is not a function")(f);
            throw new Error("f is not a function! " + f.toString());
        }
        if (typeof g !== "function") {
            inspect("g is not a function")(g);
            throw new Error("g is not a function! " + Object.keys(g));
        }
        return g(f);
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
    wDeep,
    pipe,
};

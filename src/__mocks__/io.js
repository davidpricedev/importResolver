const { memoizeWith, cond } = require("ramda");
const { isArray, isFunction, isObject } = require("ramda-adjunct");

const _config = {
    cwd: "/home/user",
};

const readFile = file => {
    switch (file) {
        case "A":
            return "file Content A";
        case "B":
            return "file Content B";
    }
};

const _writeFile = jest.fn();
const writeFile = jest.fn(f => jest.fn(c => _writeFile(f, c)));

const stripCwd = x => x.replace(`${_config.cwd}/`, "");

const printArg = x =>
    cond([
        [isArray, () => "[...]"],
        [isFunction, () => "() => {}"],
        [isObject, () => "{...}"],
        [() => true, x => x],
    ])(x);

const memoizeRegex = memoizeWith((regexStr, flags) => `${regexStr}${flags}`);
const getRegex = memoizeRegex((regexStr, flags) => new RegExp(regexStr, flags));

module.exports = {
    getRegex,
    readFile,
    writeFile,
    _writeFile,
    printArg,
    stripCwd,
    _config,
};

const sh = require('shelljs');
const { memoizeWith, curry, concat, ifElse } = require('ramda');
const { K } = require('./combinators');
const path = require('path');

/******************
 * All the IO side effects
 *****************/

const prefixCwd = x => path.join(process.cwd(), x);

const stripCwd = x => x.replace(`${process.cwd()}/`, '');

const writeFile = curry((filename, content) =>
  sh.ShellString(content).to(filename)
);

const doesFileExist = x => !!x && sh.test('-e', x);

const readFile = ifElse(doesFileExist, x => sh.cat(x).stdout, K(null));

const getAllFiles = path => sh.find(prefixCwd(path));

const getNpmFolders = () => sh.ls(prefixCwd('node_modules'));

const getNpmBuiltins = () => require('repl')._builtinLibs;

const getAllNpms = () => concat(getNpmFolders(), getNpmBuiltins());

const getProcArgs = () => process.argv.splice(2);

const memoizeRegex = memoizeWith((regexStr, flags) => `${regexStr}${flags}`);
const getRegex = memoizeRegex((regexStr, flags) => new RegExp(regexStr, flags));

/**
 * `require` that uses the current working directory as a reference point
 *  instead of the script-file location.
 * Useful for pulling in config files - for instance
 */
const requireCwd = file => require(prefixCwd(file));

module.exports = {
  readFile,
  stripCwd,
  writeFile,
  doesFileExist,
  getAllFiles,
  getAllNpms,
  getProcArgs,
  requireCwd,
  getRegex,
};

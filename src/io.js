const sh = require("shelljs");
const R = require("ramda");
//const { IO } = require("monet");

/******************
 * All the IO side effects
 *****************/

const readFile = sh.cat;

const writeFile = filename => content => sh.ShellString(content).to(filename);

const doesFileExist = x => sh.test("-e", x);

const getAllFiles = path => sh.find(path);

const getNpmFolders = () => sh.ls("node_modules");

const getNpmBuiltins = () => require("repl")._builtinLibs;

const getAllNpms = () => R.concat(getNpmFolders(), getNpmBuiltins());

const getProcArgs = () => process.argv.splice(2);

/**
 * Acts as the identity function with a console.log side effect,
 *  throws the prefix on the beginning of the console.log output
 */
const inspect = prefix => x => {
    console.log(`inspect: ${prefix}: `, x);
    return x;
};

module.exports = {
    readFile,
    writeFile,
    doesFileExist,
    getAllFiles,
    getAllNpms,
    getProcArgs,
    inspect,
};

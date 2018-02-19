const sh = require("shelljs");

const getFileContent = sh.cat;

const doesFileExist = x => sh.test("-e", x);

const getAllFiles = () => {
    return sh.find(".");
};

const getNpmFolders = () => {
    return sh.ls("node_modules");
};

const getNpmBuiltins = () => {
    return require("repl")._builtinLibs;
};

module.exports = {
    getFileContent,
    doesFileExist,
    getAllFiles,
    getNpmFolders,
    getNpmBuiltins
};

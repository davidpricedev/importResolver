const sh = require("shelljs");
const _ = require("ramda");
const cfg = require("./config");
const path = require("path");
const parser = require("./parser");

export default function run() {
    const config = cfg.getConfig();
    const allFiles = sh.find(".").filter(x => !matchesExclude(config, x));
    console.log(allFiles.slice(3,10));
    // special handling for node_modules folders is needed
    const npmFolders = sh.ls("node_modules");

    //TODO:  Check Git Clean status here

    const checkPath = _checkPath(allFiles, npmFolders);
    allFiles.forEach(x => processFile(x, checkPath));
}

export function fileFilter(config, filepath) {
    return matchesFileType(config.fileType, filepath) &&
           !matchesExclude(config.exclude, filepath);
}

export function matchesFileType(types, filepath) {
    return types.reduce((cumulator, x) => cumulator || filepath.endsWith(x), false);
}

export function matchesExclude(excludes, filepath) {
    return excludes.reduce((cumulator, x) => cumulator || filepath.startsWith(x), false);
}

/**
 * Currently uses an n-squared algo, which is probably very slow
 *  but this util shouldn't be needed in the build pipeline - just a one-off
 *  from time to time
 */
export function processFile(filename, checkPath) {
    const fileContent = sh.cat(filename);
    const paths = parser.getPotentialPaths(fileContent);
    return _.reduce((a,x) => _.concat(a, checkPath(filename)(x)))(paths);
}

/**
 * Checks the given path found in the given filename 
 *  - if the path exists, excellent nothing needs to be done
 *  - if the path doesn't exist, tries to find the location of the referenced file elsewhere in the tree
 * 
 * @param {string[]} allFiles - all the source files to examine
 * @param {string[]} npmFolders - all the npm folders to ignore/rule-out
 * @param {string} filename - the file name we are working on now
 * @param {string} path - the import/require path we are working on now
 * @return {any} the array of objects containing the remappings
 */
// TODO: find a way to handle node modules that are part of 'node' itself (path, fs, etc.)
//   - https://stackoverflow.com/a/35825896/567493
export const _checkPath = _.curry((allFiles, npmFolders, filename, refpath) => {
    if (isNpmPath(refpath, npmFolders)) {
        console.log(`[${filename}]: skipping ${refpath} - it is an npm module`);
        return;
    }

    const fileDir = path.dirname(filename);
    const exists = doesPathExist(path.join([fileDir, refpath]));
    if (exists) return; // no need to do anything

    const file = path.basename(filename);
    const fileMatches = allFiles.filter(x => x.endsWith(`/${file}`));
    if (!fileMatches || fileMatches.length === 0) {
        console.log(`[${filename}]: skipping ${refpath} - unable to find such a file`);
        return;
    }

    if (fileMatches && fileMatches.length === 1) {
        return {
            filename,
            oldPath: refpath,
            newPath: fileMatches[0]
        };
    }

    /// future, find a way to resolve the multiple matches here
    return {
        filename,
        oldPath: refpath,
        newPathOptions: fileMatches
    };
});

export function isNpmPath(refpath, npmFolders) {
    // handle sub-nav into npm modules i.e. `import { put } from 'redux-saga/effects';`
    const firstPathPart = path.includes("/") ? path.split("/")[0] : refpath;
    return _.any(_.equal(firstPathPart))(npmFolders);
}

const fileExists = _.curry(sh.test)("-e");

export function doesPathExist(config, fullPath) {
    // just in case the extensions are included
    if (fileExists(fullPath)) return true;
    
    _.find(fileExists)(config.missingExtensions);
}

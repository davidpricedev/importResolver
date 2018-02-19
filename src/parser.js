const R = require("ramda");

// TODO: use ast parsing and/or otherwise handle multi-line import statements
// Adapted from https://github.com/alantheprice/es6-import/blob/master/src/consts.js
const IMPORT_REGEX = /(?:^|\n)\s*import\s+[{}a-zA-Z1-9,_\s]*from\s+['|"](.*)['|"]/g;
const REQUIRE_REGEX = /require\(['|"](.*)['|"]\)/g;

/**
 * Returns a list of all the paths referenced in import and require statements
 */
const getPotentialPaths = fileContent => {
    return R.uniq(
        R.concat(getImportMatches(fileContent), getRequireMatches(fileContent))
    );
};

/**
 * Code adapted from code-generator at regex101.com
 * Might be able to use str.match, but that has complicated return values
 */
const getRegexMatches = regex => str => {
    let matches = [];
    let m;
    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        matches.push(m[0]);
    }

    return matches;
};

const getImportMatches = getRegexMatches(IMPORT_REGEX);

const getRequireMatches = getRegexMatches(REQUIRE_REGEX);

module.exports = {
    getPotentialPaths,
    getRegexMatches,
    IMPORT_REGEX,
    REQUIRE_REGEX
};

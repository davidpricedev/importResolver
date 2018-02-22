const R = require("ramda");

// TODO: use ast parsing and/or otherwise handle multi-line import statements
// Adapted from https://github.com/alantheprice/es6-import/blob/master/src/consts.js
const IMPORT_REGEX =
    "(?:^|\\n)\\s*import\\s+[{}a-zA-Z1-9\\-,_\\s]*from\\s+['`\"](.*)['`\"]";
const REQUIRE_REGEX = "require\\(\\s*['`\"](.*)['`\"]\\s*\\)";

/**
 * Returns a list of all the paths referenced in import and require statements
 */
const getRefsFromFileContent = fileContent => {
    return R.uniq(
        R.concat(getImportMatches(fileContent), getRequireMatches(fileContent))
    );
};

/**
 * The regex fails to work properly inside the map function unless we
 * recreate it there.
 * Regex creation is notoriously bad for performance, but to get correct behaviour we have to.
 * TODO: try memoizing the global vs non-global versions to see if that works
 */
const getRegexCaptures = regexStr => str => {
    const matches = str.match(new RegExp(regexStr, "g")) || [];
    return matches.map(x => {
        const mArr = new RegExp(regexStr).exec(x);
        if (mArr === null) return null;
        return mArr[1];
    });
};

const getImportMatches = getRegexCaptures(IMPORT_REGEX);

const getRequireMatches = getRegexCaptures(REQUIRE_REGEX);

module.exports = {
    getRefsFromFileContent,
    getImportMatches,
    getRequireMatches,
    getRegexCaptures,
    IMPORT_REGEX,
    REQUIRE_REGEX
};

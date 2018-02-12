const _ = require("ramda");

// TODO: use ast parsing and/or otherwise handle multi-line import statements
// Adapted from https://github.com/alantheprice/es6-import/blob/master/src/consts.js
export const IMPORT_REGEX = /(?:^|\n)\s*import\s+[{}a-zA-Z1-9,_\s]*from\s+['|"](.*)['|"]/g;
export const REQUIRE_REGEX = /require\(['|"](.*)['|"]\)/g;

export function getPotentialPaths(fileContent) {
    const importMatches = getRegexMatches(IMPORT_REGEX, fileContent);
    const requireMatches = getRegexMatches(REQUIRE_REGEX, fileContent);
    return _.uniq(importMatches.concat(requireMatches));
}

/**
 * Code adapted from code-generator at regex101.com
 * Might be able to use str.match, but that has complicated return values
 */
export function getRegexMatches(regex, str) {
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
}

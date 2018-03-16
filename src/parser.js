const { memoizeWith, nth } = require("ramda");
const { List } = require("./adts");
const { B } = require("./combinators");

// TODO: use ast parsing and/or otherwise handle multi-line import statements
// Adapted from https://github.com/alantheprice/es6-import/blob/master/src/consts.js
const IMPORT_REGEX =
    "(?:^|\\n)\\s*import\\s+[{}a-zA-Z1-9\\-,_\\s]*from\\s+['`\"](.*)['`\"]";
const REQUIRE_REGEX = "require\\(\\s*['`\"](.*)['`\"]\\s*\\)";

/**
 * Returns a list of all the paths referenced in import and require statements
 */
const getRefsFromFileContent = fileContent =>
    getImportMatches(fileContent)
        .concat(getRequireMatches(fileContent))
        .unique()
        .fold();

const getCaptureGroup = (regexStr, n) => str => {
    if (!str || typeof str !== "string") return List.of();
    return List.of(str.match(getRegex(regexStr, "g"))).map(
        getCapture(regexStr, n)
    );
};
const getCapture = (regexStr, n) => B(nth(n))(regexExec(regexStr));
const regexExec = regexStr => m => getRegex(regexStr).exec(m);

const memoizeRegex = memoizeWith((regexStr, flags) => `${regexStr}${flags}`);
const getRegex = memoizeRegex((regexStr, flags) => new RegExp(regexStr, flags));

const getImportMatches = getCaptureGroup(IMPORT_REGEX, 1);

const getRequireMatches = getCaptureGroup(REQUIRE_REGEX, 1);

module.exports = {
    getRefsFromFileContent,
    getImportMatches,
    getRequireMatches,
    getCaptureGroup,
    IMPORT_REGEX,
    REQUIRE_REGEX,
};

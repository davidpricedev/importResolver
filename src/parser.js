const { nth, pipe } = require("ramda");
const { Maybe } = require("./adts");
const { getRegex } = require("./io");

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

const getCaptureGroup = (regexStr, n) => str =>
    Maybe.fromString(str)
        .map(x => x.match(getRegex(regexStr, "g")))
        .toList()
        .map(getCapture(regexStr, n));

const getCapture = (regexStr, n) => pipe(regexExec(regexStr), nth(n));
const regexExec = regexStr => m => getRegex(regexStr).exec(m);

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

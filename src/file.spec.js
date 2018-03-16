jest.mock("./io");
jest.mock("./config");
//const io = require("./io");
const {
    //getFullRelativePath,
    isNpmPath,
    _isEndInList,
    _fileFilter,
    _isStartInList,
    findFilesWithMatchingNames,
    _getPotentialFileNames,
    //getRefsFromFile,
    //getProjectFiles,
    doesFileExistWithExtnLookup,
    //replaceContent,
    _replaceAll,
} = require("./file");

describe("file", () => {
    describe("_fileFilter", () => {
        const startList = ["node_modules", ".git"];
        const endList = [".jsx", ".js"];
        const config = { fileTypes: endList, exclude: startList };

        it("Will return true when a path matches end and doesn't match start", () => {
            expect(_fileFilter(config)("src/A/B/main.js")).toBe(true);
        });

        it("Will return false when a path matches end and start", () => {
            expect(_fileFilter(config)("node_modules/A/B/main.js")).toBe(false);
        });

        it("Will return false when a path doesn't match end or start", () => {
            expect(_fileFilter(config)("src/A/B/main.md")).toBe(false);
        });

        it("Will return false when a path doesn't match end and matches start", () => {
            expect(_fileFilter(config)("node_modules/A/B/main.txt")).toBe(
                false
            );
        });
    });

    describe("_isStartInList", () => {
        const list = ["node_modules", ".git"];

        it("Will be true when the path starts with an excluded folder", () => {
            expect(_isStartInList(list)("node_modules/shelljs")).toBe(true);
        });

        it("Will be false when the path does NOT start with an excluded folder", () => {
            expect(_isStartInList(list)("./ios")).toBe(false);
        });
    });

    describe("isEndInList", () => {
        const list = [".jsx", ".js"];

        it("Will be true when the file type is in the list", () => {
            expect(_isEndInList(list)("A/B/file.js")).toBe(true);
        });

        it("Will be false when the file type is NOT in the list", () => {
            expect(_isEndInList(list)("A/B/file.txt")).toBe(false);
        });
    });

    describe("isNpmPath", () => {
        const npms = ["redux-saga", "lodash", "angularjs", "fs"];

        it("Will correctly identify simple npm refs", () => {
            const result = isNpmPath(npms)("lodash");
            expect(result).toBe(true);
        });

        it("Will correctly identify npm sub-paths", () => {
            const result = isNpmPath(npms)("redux-saga/effects");
            expect(result).toBe(true);
        });

        it("Will not identify local paths", () => {
            const result = isNpmPath(npms)("./fs");
            expect(result).toBe(false);
        });
    });

    describe("_getPotentialFileNames", () => {
        it("Will map the prefix onto the extensions", () => {
            const result = _getPotentialFileNames("prefix", [".js", ".jsx"]);
            expect(result).toEqual(["prefix.js", "prefix.jsx", "prefix"]);
        });
    });

    describe("findFilesWithMatchingNames", () => {
        const extns = [".js", ".jsx"];
        const allFiles = ["X/Y/realFile.jsx"];

        it("Will return true if the file can be found at the given path", () => {
            const result = findFilesWithMatchingNames(
                allFiles,
                extns,
                "realFile"
            ).toArray();
            expect(result).toEqual(["X/Y/realFile.jsx"]);
        });

        it("Will return false if the file can NOT be found at the given path", () => {
            const result = findFilesWithMatchingNames(
                allFiles,
                extns,
                "missingFile"
            ).toArray();
            expect(result).toEqual([]);
        });
    });

    describe("doesFileExistWithExtLookup", () => {
        const extns = [".js", ".jsx"];
        const allFiles = ["X/Y/realFile.jsx"];

        it("Will return true if the file can be found at the given path", () => {
            const result = doesFileExistWithExtnLookup(
                allFiles,
                extns,
                "X/Y/realFile"
            );
            expect(result).toBe(true);
        });

        it("Will return false if the file can NOT be found at the given path", () => {
            const result = doesFileExistWithExtnLookup(
                allFiles,
                extns,
                "X/Y/missingFile"
            );
            expect(result).toBe(false);
        });
    });

    describe("_replaceAll", () => {
        it("Will replace all occurrences", () => {
            const orig = "the quick brown fox jumps over the lazy dog";
            const expected = "NEW quick brown fox jumps over NEW lazy dog";
            expect(_replaceAll("the", "NEW")(orig)).toBe(expected);
        });
    });
});

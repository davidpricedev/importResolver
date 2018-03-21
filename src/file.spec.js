jest.mock("./io");
jest.mock("./config");
const io = require("./io");
const {
    getFullRelativePath,
    isNpmPath,
    _isEndInList,
    _fileFilter,
    _isStartInList,
    findFilesWithMatchingNames,
    _getPotentialFileNames,
    _getExisting,
    doesFileExistWithExtnLookup,
    replaceContent,
    _replaceAll,
} = require("./file");

describe("file", () => {
    describe("_fileFilter", () => {
        const startList = ["node_modules", ".git"];
        const endList = [".jsx", ".js"];
        const config = { fileTypes: endList, exclude: startList };

        it("Will return true when a path matches end and doesn't match start", () => {
            const file = "/home/user/src/A/B/main.js";
            expect(_fileFilter(config)(file)).toBe(true);
        });

        it("Will return false when a path matches end and start", () => {
            const file = "/home/user/node_modules/A/B/main.js";
            expect(_fileFilter(config)(file)).toBe(false);
        });

        it("Will return false when a path doesn't match end or start", () => {
            const file = "/home/user/src/A/B/main.md";
            expect(_fileFilter(config)(file)).toBe(false);
        });

        it("Will return false when a path doesn't match end and matches start", () => {
            const file = "/home/user/node_modules/A/B/main.txt";
            expect(_fileFilter(config)(file)).toBe(false);
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

    // assumes a unix variant OS for tests!
    // other OS might break this test due to node's path.sep being different
    describe("getFullRelativePath", () => {
        it("Will get the full path based on file path and relative reference", () => {
            const result1 = getFullRelativePath(
                "/home/user/package.json",
                "./src/main.js"
            );
            expect(result1).toBe("/home/user/src/main.js");
            const result2 = getFullRelativePath(
                "/home/user/src/main.js",
                "../index.js"
            );
            expect(result2).toBe("/home/user/index.js");
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

        it("Will identify local paths if they are paths to node_modules", () => {
            const result = isNpmPath(npms)("../../node_modules/fs");
            expect(result).toBe(true);
        });
    });

    describe("_getPotentialFileNames", () => {
        it("Will map the prefix onto the extensions", () => {
            const result = _getPotentialFileNames("prefix", [".js", ".jsx"]);
            expect(result).toEqual([
                "prefix",
                "prefix.js",
                "prefix.jsx",
                "prefix/index",
                "prefix/index.js",
                "prefix/index.jsx",
            ]);
        });

        it("Will handle empty file names", () => {
            const result = _getPotentialFileNames("", [".js", ".jsx"]);
            expect(result).toEqual([
                "",
                ".js",
                ".jsx",
                "/index",
                "/index.js",
                "/index.jsx",
            ]);
        });

        it("will merge text", () => {
            const { join } = require("ramda");
            const mergeText = (a, b) => join(" ", [a, b]);
            expect(mergeText("a", null)).toBe("a ");
            expect(mergeText("a")).toBe("a ");
        });

        it("Will handle null file names", () => {
            const result = _getPotentialFileNames(null, [".js", ".jsx"]);
            expect(result).toEqual([
                "",
                ".js",
                ".jsx",
                "/index",
                "/index.js",
                "/index.jsx",
            ]);
        });

        it("Will handle empty extensions", () => {
            const result = _getPotentialFileNames("prefix", []);
            expect(result).toEqual(["prefix", "prefix/index"]);
        });

        it("Will handle null extensions", () => {
            const result = _getPotentialFileNames("prefix", null);
            expect(result).toEqual(["prefix", "prefix/index"]);
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

        it("Will return empty set if the file can NOT be found at the given path", () => {
            const result = findFilesWithMatchingNames(
                allFiles,
                extns,
                "missingFile"
            ).toArray();
            expect(result).toEqual([]);
        });
    });

    describe("doesFileExistWithExtnLookup", () => {
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

    describe("_getExisting", () => {
        const allFiles = ["X/Y/realFile.jsx", "Z/N/anotherFile.js"];

        it("Will return any potentials existing in allfiles", () => {
            const potentials = [
                "X/Y/realFile",
                "X/Y/realFile.js",
                "X/Y/realFile.jsx",
            ];
            expect(_getExisting(allFiles)(potentials)).toEqual([
                "X/Y/realFile.jsx",
            ]);
        });

        it("Will be empty when potentials don't exist", () => {
            const potentials = [
                "X/Y/fakeFile",
                "X/Y/fakeFile.js",
                "X/Y/fakeFile.jsx",
            ];
            expect(_getExisting(allFiles)(potentials)).toEqual([]);
        });

        it("Will match basename not just full path", () => {
            const potentials = ["realFile", "realFile.js", "realFile.jsx"];
            expect(_getExisting(allFiles)(potentials)).toEqual([
                "X/Y/realFile.jsx",
            ]);
        });
    });

    describe("replaceContent", () => {
        beforeEach(() => {
            io._writeFileContent.mockReset();
        });

        it("Will read content, replace and write the new content", () => {
            expect(io.readFile("A")).toBe("file Content A");
            const resolveObj = {
                filename: "A",
                searchString: "e",
                replaceString: "X",
            };
            replaceContent(resolveObj);
            expect(io._writeFileContent).toHaveBeenCalledWith(
                "A",
                "filX ContXnt A"
            );
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

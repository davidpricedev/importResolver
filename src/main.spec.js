jest.mock("./util");
jest.mock("./config");
const t = require("transducers-js");
const util = require("./util");
const main = require("./main");
const {
    isNpmPath,
    isStartInList,
    isEndInList,
    _checkPath,
    doesFileExistWithExtnLookup,
    findFilesWithMatchingNames,
    endsWith,
    filterBySubset,
    getPotentialFileNames,
    analyzeXform,
    fileFilter
} = main;

describe("main", () => {
    describe("fileFilter", () => {
        const startList = ["node_modules", ".git"];
        const endList = [".jsx", ".js"];
        const config = { fileType: endList, exclude: startList };

        it("Will return true when a path matches end and doesn't match start", () => {
            expect(fileFilter(config)("src/A/B/main.js")).toBe(true);
        });

        it("Will return false when a path matches end and start", () => {
            expect(fileFilter(config)("node_modules/A/B/main.js")).toBe(false);
        });

        it("Will return false when a path doesn't match end or start", () => {
            expect(fileFilter(config)("src/A/B/main.md")).toBe(false);
        });

        it("Will return false when a path doesn't match end and matches start", () => {
            expect(fileFilter(config)("node_modules/A/B/main.txt")).toBe(false);
        });
    });

    describe("isStartInList", () => {
        const list = ["node_modules", ".git"];

        it("Will be true when the path starts with an excluded folder", () => {
            expect(isStartInList("node_modules/shelljs")(list)).toBe(true);
        });

        it("Will be false when the path does NOT start with an excluded folder", () => {
            expect(isStartInList("./utils")(list)).toBe(false);
        });
    });

    describe("isEndInList", () => {
        const list = [".jsx", ".js"];

        it("Will be true when the file type is in the list", () => {
            expect(isEndInList("A/B/file.js")(list)).toBe(true);
        });

        it("Will be false when the file type is NOT in the list", () => {
            expect(isEndInList("A/B/file.txt")(list)).toBe(false);
        });
    });

    describe("analyzeXform", () => {
        it("Will build a map + null-filter transform based on a map function", () => {
            const input = [0, 1, 2, 3, 4, 5];
            const dblEvens = x => (x % 2 === 0 ? 2 * x : null);
            const xform = analyzeXform(dblEvens);
            expect(t.into([], xform, input)).toEqual([0, 4, 8]);
        });
    });

    describe("_checkPath", () => {
        const allFiles = ["X/Y/realFile.js", "X/Y/movedFile.jsx"];
        const npmFolders = ["shelljs", "redux-saga", "fs"];
        const excludedExtns = [".js", ".jsx"];
        const checkPath = _checkPath(allFiles, npmFolders, excludedExtns);

        it("Will exit early with a message if it matches an npm path", () => {
            const file = "A/B/main.js";
            const refpath = "redux-saga/effects";
            const result = checkPath(file, refpath);
            const expected = {
                filename: file,
                refpath,
                reason: "NPM",
                message: `[${file}]: skipping ${refpath} - it is an npm module`
            };
            expect(result).toEqual(expected);
        });

        it("Will exit early if the referenced file exists", () => {
            const result = checkPath("A/B/main.js", "../../X/Y/realFile");
            expect(result).toBe(null);
        });

        it("Will exit early if the referenced file cannot be found anywhere in the allFiles tree", () => {
            const file = "A/B/main.js";
            const refpath = "./utils";
            const result = checkPath(file, refpath);
            const expected = {
                filename: file,
                refpath,
                reason: "NOT_FOUND",
                message: `[${file}]: skipping ${refpath} - unable to find such a file`
            };
            expect(result).toEqual(expected);
        });

        it("Will return an object containing info about replacement when a match is found", () => {
            const result = checkPath("A/B/main.js", "./movedFile");
            expect(result).toMatchObject({
                filename: "A/B/main.js",
                oldPath: "./movedFile",
                newPath: "X/Y/movedFile.jsx"
            });
        });
    });

    describe("isNpmPath", () => {
        const npms = ["redux-saga", "lodash", "angularjs", "fs"];

        it("Will correctly identify simple npm refs", () => {
            const result = isNpmPath(npms, "lodash");
            expect(result).toBe(true);
        });

        it("Will correctly identify npm sub-paths", () => {
            const result = isNpmPath(npms, "redux-saga/effects");
            expect(result).toBe(true);
        });

        it("Will not identify local paths", () => {
            const result = isNpmPath(npms, "./fs");
            expect(result).toBe(false);
        });
    });

    describe("endsWith", () => {
        it("will return true if the string ends with the given value", () => {
            const result = endsWith("Hello/World/123")("123");
            expect(result).toBe(true);
        });

        it("will return false if the string does NOT end with the given value", () => {
            const result = endsWith("Hello/World/123")("NOPE");
            expect(result).toBe(false);
        });
    });

    describe("filterBySubset", () => {
        const searchSet = [1, 2, 3, 4, 5, 6, 7, 8];
        it("Will filter by subset equality", () => {
            const predicate = x => y => x === y;
            const result = filterBySubset(predicate, searchSet, [4, 8]);
            expect(result).toEqual([4, 8]);
        });

        it("Will filter by subset divisible by", () => {
            const predicate = x => y => x % y === 0;
            const result = filterBySubset(predicate, searchSet, [2, 3]);
            expect(result).toEqual([2, 3, 4, 6, 8]);
        });
    });

    describe("getPotentialFileNames", () => {
        it("Will map the prefix onto the extensions", () => {
            const result = getPotentialFileNames("prefix", [".js", ".jsx"]);
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
            );
            expect(result).toEqual(["X/Y/realFile.jsx"]);
        });

        it("Will return false if the file can NOT be found at the given path", () => {
            const result = findFilesWithMatchingNames(
                allFiles,
                extns,
                "missingFile"
            );
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
});

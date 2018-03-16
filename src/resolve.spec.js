const {
    solutionObj,
    composeFirstTruthy,
    firstTruthyReducer,
    resolveValidation,
    first,
    closest,
    editDistance,
} = require("./resolve.js");
const { merge } = require("ramda");

describe("resolve", () => {
    const tf = () => ({
        mul: jest.fn((x, y) => x * y),
        add: jest.fn((x, y) => x + y),
    });
    const filename = "fakeFile";
    const refpath = "fakeRefPath";
    const inputBase = {
        filename,
        oldPath: refpath,
    };

    let t;
    beforeEach(() => {
        t = tf();
    });

    describe("commposeFirstTruthy", () => {
        it("Will run all functions if only the last returns truthy", () => {
            const result = composeFirstTruthy(t.mul, t.add)(2, 0);
            expect(result).toBe(2);
            expect(t.mul).toHaveBeenCalled();
            expect(t.add).toHaveBeenCalled();
        });

        it("Will only run the first function if it returns truthy", () => {
            const result = composeFirstTruthy(t.add, t.mul)(2, 0);
            expect(result).toBe(2);
            expect(t.add).toHaveBeenCalled();
            expect(t.mul).not.toHaveBeenCalled();
        });
    });

    describe("firstTruthyReducer", () => {
        it("will return a reducer that takes the first truthy value", () => {
            const reducer = firstTruthyReducer(2, 0);
            expect(reducer("trueValue", null)).toBe("trueValue");
        });

        it("Will run the second argument as a function agains the args", () => {
            const reducer = firstTruthyReducer(2, 0);
            expect(reducer(null, (x, y) => x * y)).toBe(0);
            expect(reducer(null, (x, y) => x + y)).toBe(2);
        });
    });

    describe("solutionObj", () => {
        it("Will merge solution into object", () => {
            expect(solutionObj(inputBase, "fakeOptionA")).toEqual({
                filename,
                oldPath: refpath,
                newPath: "fakeOptionA",
            });
        });

        it("Will merge an error message if the solution is falsy", () => {
            expect(solutionObj(inputBase, false)).toEqual({
                filename,
                oldPath: refpath,
                message: "unable to find such a file",
            });
        });
    });

    describe("resolveValidation", () => {
        it("Will throw if no options supplied", () => {
            expect(() => resolveValidation({})).toThrow();
            expect(() => resolveValidation({ potentials: [] })).toThrow();
        });

        it("Will return the option if only one is supplied", () => {
            const input = merge(inputBase, {
                potentials: ["fakeOption"],
            });
            expect(resolveValidation(input)).toMatchObject(
                merge(inputBase, {
                    newPath: "fakeOption",
                })
            );
        });

        it("Will return nothing if multiple options are supplied", () => {
            const input = merge(inputBase, {
                potentials: ["fakeOptionA", "fakeOptionB"],
            });
            expect(resolveValidation(input)).toBe(undefined);
        });
    });

    describe("first", () => {
        it("Will return the first option", () => {
            const input = merge(inputBase, {
                potentials: ["fakeOptionA", "fakeOptionB"],
            });
            expect(first(input)).toMatchObject(
                merge(inputBase, {
                    newPath: "fakeOptionA",
                })
            );
        });
    });

    describe("closest", () => {
        it("Will find the closest option", () => {
            const input = merge(inputBase, {
                potentials: [
                    "../../../A/B/Z/X/Y/util.js",
                    "../../../A/B/util.js",
                ],
            });
            expect(closest(input)).toBe(input.potentials[1]);
        });
    });

    describe("editDistance", () => {
        it("Will find the nearest path by edit distance", () => {
            const input = merge(inputBase, {
                oldPath: "../../feature/cosmicChameleon",
                potentials: [
                    "../../features/cosmicChameleon",
                    "../../view/cosmicChameleon",
                ],
            });
            expect(editDistance(input)).toBe(input.potentials[0]);
        });
    });
});

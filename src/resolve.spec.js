const {
    solutionObj,
    composeFirstTruthy,
    firstTruthyReducer,
    resolveValidation,
    first,
    closest,
    resolve,
    editDistance,
} = require("./resolve.js");
const { Maybe, List } = require("./adts");
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
        it("Will return maybe.some if potentials were supplied", () => {
            const input = merge(inputBase, {
                potentials: List.of(["fakeOptionA", "fakeOptionB"]),
            });
            expect(resolveValidation(input)).toMatchObject({ _some: true });
        });

        it("Will return maybe.none if no potentials were supplied", () => {
            expect(resolveValidation(inputBase)).toMatchObject({ _none: true });
        });
    });

    describe("first", () => {
        it("Will return the first option", () => {
            const input = Maybe.Some(
                merge(inputBase, {
                    potentials: List.of(["fakeOptionA", "fakeOptionB"]),
                })
            );
            expect(first(input)).toMatchObject({ first: "fakeOptionA" });
        });
    });

    describe("closest", () => {
        it("Will find the closest option", () => {
            const potentials = [
                "../../../A/B/Z/X/Y/util.js",
                "../../../A/B/util.js",
            ];
            const input = Maybe.Some(
                merge(inputBase, {
                    potentials: List.of(potentials),
                })
            );
            expect(closest(input)).toMatchObject({ closest: potentials[1] });
        });
    });

    describe("editDistance", () => {
        it("Will find the nearest path by edit distance", () => {
            const potentials = [
                "../../features/cosmicChameleon",
                "../../view/cosmicChameleon",
            ];
            const input = Maybe.Some(
                merge(inputBase, {
                    oldPath: "../../feature/cosmicChameleon",
                    potentials: List.of(potentials),
                })
            );
            expect(editDistance(input)).toMatchObject({
                editDist: potentials[0],
            });
        });
    });

    describe("resolve", () => {
        it("Will resolve all algorithms", () => {
            const potentials = [
                "../../features/cosmicChameleon",
                "../../view/cosmicChameleon",
            ];
            const input = merge(inputBase, {
                oldPath: "../../feature/cosmicChameleon",
                potentials: List.of(potentials),
            });
            expect(resolve(input)).toMatchObject({
                first: potentials[0],
                closest: potentials[0],
                editDist: potentials[0],
            });
        });
    });
});

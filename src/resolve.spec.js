const {
    resolveObj,
    composeFirstTruthy,
    firstTruthyReducer,
    resolveValidation,
    first,
    closest
} = require("./resolve.js");

describe("resolve", () => {
    const tf = () => ({
        mul: jest.fn((x, y) => x * y),
        add: jest.fn((x, y) => x + y)
    });
    const filename = "fakeFile";
    const refpath = "fakeRefPath";

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

    describe("resolveObj", () => {
        it("Will change args to object", () => {
            expect(resolveObj(filename, refpath, "fakeOptionA")).toEqual({
                filename,
                oldpath: refpath,
                newpath: "fakeOptionA"
            });
        });
    });

    describe("resolveValidation", () => {
        it("Will throw if no options supplied", () => {
            expect(() => resolveValidation("", "", null)).toThrow();
            expect(() => resolveValidation("", "", [])).toThrow();
        });

        it("Will return the option if only one is supplied", () => {
            expect(
                resolveValidation(filename, refpath, ["fakeOption"])
            ).toEqual({
                filename,
                oldpath: refpath,
                newpath: "fakeOption"
            });
        });

        it("Will return nothing if multiple options are supplied", () => {
            expect(
                resolveValidation("fakeFile", "fakeRefPath", [
                    "fakeOptionA",
                    "fakeOptionB"
                ])
            ).toBe(undefined);
        });
    });

    describe("first", () => {
        it("Will return the first option", () => {
            expect(
                first(filename, refpath, ["fakeOptionA", "fakeOptionB"])
            ).toEqual({
                filename,
                oldpath: refpath,
                newpath: "fakeOptionA"
            });
        });
    });

    describe("closest", () => {
        it("Will find the closest option", () => {
            const options = [
                "../../../A/B/Z/X/Y/util.js",
                "../../../A/B/util.js"
            ];
            expect(closest(filename, refpath, options)).toBe(options[1]);
        });
    });
});

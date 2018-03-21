const {
    List,
    reduceOr,
    myIsString,
    flatMapReducer,
    reduceAnd,
    _unnest,
} = require("./adts");

describe("adts", () => {
    describe("list", () => {
        it("Will be non-empty", () => {
            expect(List.of(["a"]).isNonEmpty()).toBe(true);
            expect(List.of(["a"]).isEmpty()).toBe(false);
        });

        it("Will be empty", () => {
            expect(List.of([]).isEmpty()).toBe(true);
            expect(List.of([]).isNonEmpty()).toBe(false);
        });
    });

    describe("utils", () => {
        it("Will reduceOr", () => {
            const tttt = [true, true, true, true];
            expect(tttt.reduce(reduceOr, true)).toBe(true);
            const tfff = [true, false, false, false];
            expect(tfff.reduce(reduceOr, false)).toBe(true);
            const ftff = [false, true, false, false];
            expect(ftff.reduce(reduceOr, false)).toBe(true);
            const fftf = [false, false, true, false];
            expect(fftf.reduce(reduceOr, false)).toBe(true);
            const ffft = [false, false, false, true];
            expect(ffft.reduce(reduceOr, false)).toBe(true);
            const ffff = [false, false, false, false];
            expect(ffff.reduce(reduceOr, false)).toBe(false);
        });

        it("Will reduceAnd", () => {
            const tttt = [true, true, true, true];
            expect(tttt.reduce(reduceAnd, true)).toBe(true);
            const fttt = [false, true, true, true];
            expect(fttt.reduce(reduceAnd, true)).toBe(false);
            const tftt = [true, false, true, true];
            expect(tftt.reduce(reduceAnd, true)).toBe(false);
            const ttft = [true, true, false, true];
            expect(ttft.reduce(reduceAnd, true)).toBe(false);
            const tttf = [true, true, true, false];
            expect(tttf.reduce(reduceAnd, true)).toBe(false);
            const ffff = [false, false, false, false];
            expect(ffff.reduce(reduceAnd, false)).toBe(false);
        });

        it("Will test for strings", () => {
            const aString = "this is a string";
            const fn = () => "function, not string";
            const arr = ["array", "not", "string"];
            const obj = { obj: "not string" };
            expect(myIsString(aString)).toBe(true);
            expect(myIsString(fn)).toBe(false);
            expect(myIsString(arr)).toBe(false);
            expect(myIsString(obj)).toBe(false);
        });

        it("Will flatmap", () => {
            const data = [1, [2, 3], List.of([4, 5])];
            const result = data.map(_unnest).reduce(flatMapReducer, []);
            expect(result).toEqual([1, 2, 3, 4, 5]);
        });
    });

    describe("maybe", () => {});
});

const { Table, calculateDistance, getReplaceCost } = require("./editDistance");

describe("Table", () => {
    it("Will create an initialized 2d table", () => {
        const t = new Table(10, 10, 37);
        expect(t.get(9, 9)).toBe(37);
    });

    it("Will foreach over the entire table", () => {
        const t = new Table(10, 10, 10);
        t.map((x, y, value) => value * 2);
        expect(t.get(0, 0)).toBe(20);
    });

    it("Will translate x/y coords to a single-array index", () => {
        const t = new Table(10, 10, 10);
        expect(t.whtoindex(5, 7)).toBe(75);
    });

    it("Will translate an index to width and height coords", () => {
        const t = new Table(10, 10, 10);
        expect(t.len).toBe(10 * 10);
        expect(t.width).toBe(10);
        expect(t.indextowh(75)).toEqual({ i: 5, j: 7 });
    });
});

describe("calculateDistance", () => {
    const tests = {
        // desc: [str1, str2, expectedValue],
        catdog: ["cat", "dog", 3],
        fatcat: ["fat", "cat", 1]
    };

    it("Will calculate replacement cost", () => {
        expect(getReplaceCost(0, "a", "a")).toBe(0);
        expect(getReplaceCost(5, "a", "a")).toBe(5);
        expect(getReplaceCost(5, "a", "b")).toBe(6);
        expect(getReplaceCost(0, "a", "b")).toBe(1);
    });

    Object.keys(tests).forEach(x => {
        it(`Will return an expected edit distance (${x})`, () => {
            const result = calculateDistance(tests[x][0], tests[x][1]);
            expect(result).toBe(tests[x][2]);
        });
    });
});

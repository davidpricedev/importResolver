const { getRegex } = require("./io");
const RA = require("ramda-adjunct");

describe("io", () => {
    describe("getRegex", () => {
        it("Will be memoized", () => {
            const r1 = getRegex("abc", "g");
            const r2 = getRegex("abc", "g");
            expect(r1).toBe(r2);
        });

        it("Will be a regex", () => {
            const result = getRegex("abc", "g");
            expect(RA.isRegExp(result)).toBe(true);
        });
    });
});

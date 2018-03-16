const { List } = require("./adts");

describe("adts", () => {
    it("Will be non-empty", () => {
        expect(List.of(["a"]).isNonEmpty()).toBe(true);
        expect(List.of(["a"]).isEmpty()).toBe(false);
    });

    it("Will be empty", () => {
        expect(List.of([]).isEmpty()).toBe(true);
        expect(List.of([]).isNonEmpty()).toBe(false);
    });
});

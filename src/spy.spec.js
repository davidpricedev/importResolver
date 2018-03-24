const { inspectItem, observe } = require("./spy");

const replace = (loc, name, newimpl) => {
    const orig = loc[name];
    loc[name] = newimpl;
    return () => (loc[name] = orig);
};

describe("spy", () => {
    let unreplace;
    let logSpy;
    beforeEach(() => {
        logSpy = jest.fn();
        unreplace = replace(global.console, "log", logSpy);
    });

    afterEach(() => {
        unreplace();
    });

    describe("inspectItem", () => {
        it("Will inspectItem", () => {
            const data = [1, 2, "a"];
            inspectItem("random data")(data);
            expect(logSpy).toHaveBeenCalledWith(
                "inspectItem: random data: ",
                data
            );
        });
    });

    describe("observe", () => {
        const multiply = (a, b) => a * b;

        it("will observe", () => {
            observe("mult", multiply)(3, 5);
            expect(logSpy).toHaveBeenCalledWith(
                "[mult] multiply(",
                [3, 5],
                ") -> ",
                15
            );
        });
    });
});

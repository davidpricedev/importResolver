const { inspect, observe } = require("./spy");

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

    describe("inspect", () => {
        it("Will inspect", () => {
            const data = [1, 2, "a"];
            inspect("random data")(data);
            expect(logSpy).toHaveBeenCalledWith("inspect: random data: ", data);
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

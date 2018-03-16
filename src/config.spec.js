const { getConfig, defaultConfig } = require("./config");

describe("config", () => {
    it("Will return default config when no file is provided", () => {
        expect(getConfig([])).toEqual(defaultConfig());
    });
});

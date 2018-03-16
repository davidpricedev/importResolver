const {
    getRefsFromFileContent,
    getImportMatches,
    getRequireMatches,
} = require("./parser");

describe("parser", () => {
    describe("getRefsFromFileContent", () => {});

    describe("getImportMatches", () => {
        const stringsToCheck = {
            destructured: "import { funC-123_B }  from \"./A/B/theRefPath\"",
            default: "import lib from './A/B/theRefPath'",
            multiline: `import { 
                A,
                B,
            } from './A/B/theRefPath'`,
        };
        Object.keys(stringsToCheck).forEach(x =>
            it(`Will find the import statement (${x})`, () => {
                expect(getImportMatches(stringsToCheck[x]).fold()).toEqual([
                    "./A/B/theRefPath",
                ]);
            })
        );

        it("Will find all the imports in a big block", () => {
            const imports = `
                import x from 'a';
                import x as y from 'b';
                import { x } from 'a';
                import {
                x, y 
                } from 'c';
                import lib from "./A/B/theRefPath";
                import { funC-123_B }  from "./A/B/theRefPath";
                import { 
                                A,
                                B,
                            } from \`./A/B/theRefPath\`;
                `;
            const expected = [
                "a",
                "b",
                "a",
                "c",
                "./A/B/theRefPath",
                "./A/B/theRefPath",
                "./A/B/theRefPath",
            ];
            expect(getImportMatches(imports).fold()).toEqual(expected);
        });
    });

    describe("getRequireMatches", () => {
        const stringsToCheck = {
            destructured: "const { x } = require('./x/y/therefpath');",
            default: "const b = require(\"./x/y/therefpath\");",
            property: "const c = require('./x/y/therefpath').property;",
            multiline: `const x = require(
                './x/y/therefpath'
            );`,
        };
        Object.keys(stringsToCheck).forEach(x =>
            it(`Will find the require statement (${x})`, () => {
                expect(getRequireMatches(stringsToCheck[x]).fold()).toEqual([
                    "./x/y/therefpath",
                ]);
            })
        );

        it("Will find all the requires in a big block", () => {
            const requires = `
                const x = require('a');
                const { x } = require('b');
                const {
                x, y 
                } = require('c');
                const lib = require("./A/B/theRefPath");
                const funC-123_B = require(
                    "./A/B/theRefPath"
                );
                const { 
                                A,
                                B,
                            } = require(\`./A/B/theRefPath\`);
                `;
            const expected = [
                "a",
                "b",
                "c",
                "./A/B/theRefPath",
                "./A/B/theRefPath",
                "./A/B/theRefPath",
            ];
            expect(getRequireMatches(requires).fold()).toEqual(expected);
        });
    });

    describe("getRefsFromFileContent", () => {
        it("Will find the imports and requires from a mixed block", () => {
            const mixedBlock = `
            import x from 'a';
            import x as y from 'b';
            import { x } from 'a';
            const x = require('d');
            import {
            x, y 
            } from 'c';
            import lib from "./A/B/theRefPath";
            import { funC-123_B }  from "./A/B/theRefPath";
            import { 
                            A,
                            B,
                        } from \`./A/B/theRefPath\`; 
            const { x } = require('b');
            const {
            x, y 
            } = require('c');
            const lib = require("./A/B/theRefPath");
            const funC-123_B = require(
                "./A/B/theRefPath"
            );
            const { 
                            A,
                            B,
                        } = require(\`./A/B/theRefPath\`); 
            `;
            const expected = ["a", "b", "c", "./A/B/theRefPath", "d"];
            expect(getRefsFromFileContent(mixedBlock)).toEqual(expected);
        });
    });
});

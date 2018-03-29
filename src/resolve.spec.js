const {
    resolveValidation,
    first,
    closest,
    resolve,
    editDistance,
} = require("./resolve.js");
const { Maybe, List } = require("./adts");
const { merge } = require("ramda");

describe("resolve", () => {
    const filename = "fakeFile";
    const refpath = "fakeRefPath";
    const inputBase = {
        filename,
        oldPath: refpath,
    };

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
                minDistance: potentials[0],
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
                minDistance: potentials[0],
            });
        });
    });
});

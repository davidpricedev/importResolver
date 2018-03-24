const R = require("ramda");

/**
 * Implements a 2d table / matrix
 * TODO: explore the possibility of migrating this entire algorithm
 *  to use applicatives?
 */
class Table {
    constructor(width, height, init) {
        this.width = width;
        this.height = height;
        this.len = width * height;

        // initialize all entries with `init` or null
        const initVal = !R.isNil(init) ? init : null;
        this.table = R.map(R.always(initVal))(R.range(0, this.len));

        this.get = R.curry((r, c) => this.table[this.whtoindex(r, c)]);

        this.set = R.curry((r, c, value) => {
            this.table[this.whtoindex(r, c)] = value;
        });

        this.nodeAt = Node(this);

        this.whtoindex = (r, c) => R.add(r, R.multiply(c, this.width));

        this.indextowh = index => {
            const c = Math.floor(index / this.width);
            const r = index - c * this.width;
            return { r, c };
        };

        /**
         * mutating, maps the given callback across the table.
         * the callback should expect a node as the argument
         */
        this.map = mapFn => {
            this.table.forEach((x, index) => {
                const { r, c } = this.indextowh(index);
                this.table[index] = mapFn(this.nodeAt(r, c));
            });
        };

        this.print = () => {
            console.log(
                R.map(x => R.slice(x, x + this.width, this.table))(
                    R.range(0, this.height)
                )
            );
        };
    }
}

const Node = R.curry((table, r, c) => ({
    rowIndex: r,
    colIndex: c,
    get: () => table.get(r, c),
    set: table.set(r, c),
    prevInCol: () => table.nodeAt(r, c - 1),
    prevInRow: () => table.nodeAt(r - 1, c),
    prevDiag: () => table.nodeAt(r - 1, c - 1),
    firstInCol: () => R.equals(0, c),
    firstInRow: () => R.equals(0, r),
}));

/**
 * Implements a "dynamic programming" solution to calculate edit distance
 * adapted from https://nlp.stanford.edu/IR-book/html/htmledition/edit-distance-1.html
 */
const calculateDistance = R.curry((strh, strv) => {
    console.log("calculating ", strh, strv);
    const m = new Table(strh.length + 1, strv.length + 1, 0);
    const myReplaceCost = getReplaceCost(strh, strv);

    m.map(node => {
        if (node.firstInCol()) return node.rowIndex;
        if (node.firstInRow()) return node.colIndex;
        const min = R.reduce(R.min, Infinity)([
            myReplaceCost(node),
            getDelCost(node),
            getInsCost(node),
        ]);
        return min;
    });

    return m.get(m.width - 1, m.height - 1);
});

const tableToStringOffset = R.add(-1);
const getCharInStr = str => R.pipe(tableToStringOffset, R.flip(R.nth)(str));
const getPrevInCol = node => node.prevInCol().get();
const getPrevInRow = node => node.prevInRow().get();
const getPrevDiag = node => node.prevDiag().get();
const getDelCost = R.compose(R.add(1), getPrevInRow);
const getInsCost = R.compose(R.add(1), getPrevInCol);
const getReplaceCost = (str1, str2) => node =>
    calculateReplaceCost(
        getPrevDiag(node),
        R.ap([
            R.pipe(R.prop("rowIndex"), getCharInStr(str1)),
            R.pipe(R.prop("colIndex"), getCharInStr(str2)),
        ])([node])
    );
const identical = ([a, b]) => R.identical(a, b);
const currentReplaceCost = R.ifElse(identical, R.always(0), R.always(1));
const calculateReplaceCost = (last, twoChars) =>
    R.add(last)(currentReplaceCost(twoChars));

module.exports = {
    Table,
    Node,
    calculateDistance,
    calculateReplaceCost,
    getDelCost,
    getInsCost,
    currentReplaceCost,
    getReplaceCost,
};

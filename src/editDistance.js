const R = require("ramda");

/**
 * Implements a 2d table / matrix
 */
class Table {
    constructor(width, height, init) {
        this.width = width;
        this.height = height;
        this.len = width * height;

        // initialize all entries with `init` or null
        const initVal = !R.isNil(init) ? init : null;
        this.table = R.map(() => initVal)(R.range(0, this.len));

        this.get = R.curry((i, j) => {
            return this.table[i + j * this.width];
        });

        this.set = R.curry((i, j, value) => {
            this.table[i + j * this.width] = value;
        });

        this.whtoindex = (i, j) => i + j * this.width;

        this.indextowh = index => {
            const j = Math.floor(index / this.width);
            const i = index - j * this.width;
            return { i, j };
        };

        /**
         * mutating, maps the given callback across the table.
         * the callback should expect (x, y, value) as args
         */
        this.map = mapFn => {
            this.table.forEach((x, index) => {
                const { i, j } = this.indextowh(index);
                this.table[index] = mapFn(i, j, x);
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

/**
 * Implements a "dynamic programming" solution to calculate edit distance
 * adapted from https://nlp.stanford.edu/IR-book/html/htmledition/edit-distance-1.html
 */
const calculateDistance = (str1, str2) => {
    const m = new Table(str1.length + 1, str2.length + 1, 0);
    const irange = R.range(0, m.width);
    const jrange = R.range(0, m.height);
    R.forEach(i => m.set(i, 0)(i), irange);
    R.forEach(j => m.set(0, j)(j), jrange);
    m.map((i, j, val) => {
        if (i === 0 || j === 0) return val;

        const rcost = getReplaceCost(
            m.get(i - 1, j - 1),
            str1[i - 1],
            str2[j - 1]
        );
        const delcost = 1 + m.get(i - 1, j);
        const inscost = 1 + m.get(i, j - 1);
        const min = R.reduce(R.min, Infinity)([rcost, delcost, inscost]);
        return min;
    });

    return m.get(m.width - 1, m.height - 1);
};

const getReplaceCost = (last, ival, jval) => {
    const replaceCost = ival === jval ? 0 : 1;
    return last + replaceCost;
};

module.exports = {
    Table,
    calculateDistance,
    getReplaceCost
};

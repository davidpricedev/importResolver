const readFile = file => {
    switch (file) {
        case "A":
            return "file Content A";
        case "B":
            return "file Content B";
    }
};

const inspect = prefix => x => {
    console.log(`inspect: ${prefix}: `, x);
    return x;
};

module.exports = {
    readFile,
    inspect,
};

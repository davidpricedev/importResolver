const getFileContent = file => {
    switch (file) {
        case "A":
            return "file Content A";
        case "B":
            return "file Content B";
    }
};

module.exports = {
    getFileContent
};

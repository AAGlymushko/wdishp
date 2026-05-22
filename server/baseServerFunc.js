const bcrypt = require('bcrypt');
function checkChar(string, forbiddenSymbols) {
    for (let i = 0; i < string.length; ++i) {
        for (let j = 0; j < forbiddenSymbols.length; ++j) {
            if (string[i] == forbiddenSymbols[j]) {
                return true;
            }
        }
    }
    return false;
}
function chekStrLength(string, minLenght, maxLength) {
    return (minLenght <= string.length && string.length <= maxLength);
}
function hash(string) {
    try {
        return bcrypt.hashSync(string, 12);
    } catch (err) {
        return "#"
    }
}

module.exports = { checkChar, chekStrLength, hash };
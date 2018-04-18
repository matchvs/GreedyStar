let config = require('../Global/Config');

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getRandomColor() {
    let colorList = config.colorList;
    return colorList[getRandom(0, colorList.length - 1)]
}

function getRandomScore() {
    let scoreList = config.scoreList;
    return scoreList[getRandom(0, scoreList.length - 1)]
}

function foodArrFilter(arr, foodId) {
    for (let i = 0, l = arr.length; i < l; i++) {
        if (arr[i][2] === foodId) {
            return { result: true, i: i };
        }
        if (i === l - 1) {
            return { result: false };
        }
    }
}

function foodArrSplice(arr, i) {
    arr.splice(i, 1);

}

// arr: b = q + b
function combineInto(q, b) {
    var len = q.length;
    for (var i = 0; i < len; i = i + 20) {
        b.unshift.apply(b, q.slice(i, i + 20));
    }
}

module.exports = {
    getRandom,
    getRandomColor,
    getRandomScore,
    foodArrFilter,
    foodArrSplice,
    combineInto
};

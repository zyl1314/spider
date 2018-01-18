const fs = require('fs');
const path = require('path');

function merge(to, from) {
    for (let key in from) {
        to[key] = from[key]
    }

    return to;
}

function optimist(arr) {
    let config = {};
    if (!arr.length) return config;

    for (let i = 0; i < arr.length; i++) {
        config[arr[i++].slice(1)] = arr[i];
    }
    return config;
}

function dirInit(origin) {
    if (fs.existsSync(origin)) {
        return
    } else {
        dirInit(path.dirname(origin));
        fs.mkdirSync(origin);
    }
}

module.exports = {
    merge,
    optimist,
    dirInit
}
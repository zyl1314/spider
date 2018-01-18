const path = require('path');

module.exports = {
    disk: path.resolve(__dirname, 'disk'),
    pageNum: 50,
    start: 0,
    timeout: 2000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36',
    }
}
const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { merge, optimist, dirInit } = require('./util.js');

let config = require('./config.js');
const userConfig = optimist(process.argv.splice(2));

// 合并默认config与命令行config
merge(config, userConfig);

// 话题页面链接
function getLink(start) {
    let data = '';

    https.get(
        {
            hostname: 'www.douban.com',
            path: `/group/haixiuzu/discussion?start=${start}`,
            headers: config.headers
        },
        (res) => {
            res.setEncoding('utf-8')
            res.on('data', (chunk) => {
                data+=chunk;
            })
            res.on('end', () => {
                const $ = cheerio.load(data, {normalizeWhitespace: true});
                const links = $('td.title a');
                for (let key in links) {
                    if (!isNaN(key)) pageLinksPool.push(links[key].attribs.href);
                }
                if (pageLinksPool.length < config.pageNum) {
                    start+=25;

                    //  防止被屏蔽
                    setTimeout(() => {
                        getLink(start);
                    }, config.timeout)
                } else {
                    console.log(pageLinksPool)
                    getPic();
                }
            })
        }
    ).on('error', (err) => {
        start+=25;
        getLink(start);
    })
}

// 图片链接
function getPic() {
    let pageLink = '';
    if(pageLink = pageLinksPool.shift()) {
        let data = '';
        https.get(
            {
                hostname: 'www.douban.com',
                path: pageLink,
                headers: config.headers                
            },
            (res) => {
                res.setEncoding('utf-8');

                res.on('data', (chunk) => {
                    data+= chunk;
                })
           
                res.on('end', () => {
                    const $ = cheerio.load(data, {normalizeWhitespace: true});
                    // 两种匹配规则
                    let pics = $('.image-wrapper img');
                    if (pics) {
                        for (let key in pics) {
                            if (!isNaN(key)) picLinksPool.push(pics[key].attribs.src);
                        }
                    }

                    pics = $('.topic-figure img');
                    if (pics) {
                        for (let key in pics) {
                            if (!isNaN(key)) picLinksPool.push(pics[key].attribs.src);
                        }
                    }

                    //  防屏蔽
                    setTimeout(() => {
                        getPic();
                    }, config.timeout)
                })
            }
        ).on('error', () => {
            getPic();
        })
    } else {
        console.log(picLinksPool)
        doTask();
    }

}

// 下载图片
function downloadPic(link) {
    const ext = path.extname(link);
    const picName = path.resolve(config.disk, new Date().getTime() + ext);
    const writer = fs.createWriteStream(picName);

    return new Promise((resolve, reject) => {
        https.get(
            {
                hostname: 'www.douban.com',
                path: link,
                headers: config.headers
            },
            (res) => {
                res.pipe(writer);
                res.on('end', () => {
                    resolve(null);
                })
            }
        ).on('error', (err) => {
            resolve(null);
        })
    })
}


// 开始下载任务
function doTask() {
    dirInit(config.disk);

    function next() {
        const picLink = picLinksPool.shift();
        if (!picLink) return;
        downloadPic(picLink).then(() => {
            setTimeout(() => {
                next()
            }, config.timeout)
        })
    }

    next();
}

// 页面链接池
let start = 0;
let pageLinksPool = [];
let picLinksPool = [];

getLink(config.start);

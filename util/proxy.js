const request = require('request-promise-native');
const Proxy = require('../models/proxy');

// Returns proxy list from proxyscrape.com
async function GetProxies() {
    let url = `https://api.proxyscrape.com/?request=getproxies&proxytype=socks4&timeout=500&country=all`;

    let proxyList = null;

    try {
        let res = await request.get(url);
        // validate the proxies
        proxyList = res.split("\r\n").filter(proxy => {
            // do not allow emtpy values
            if (proxy === "") {
                return false;
            }
            return true;
        })

        // now validate that we actually got proxies
        // this will validate ip:port
        let regex = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/g);
        res = regex.test(proxyList[0]);
        if (res === false) {
            return Promise.reject("Bad proxy list.")
        }
        return Promise.resolve(proxyList)
    } catch (error) {
        return Promise.reject("Could not fetch proxy list.")
    }
};

// Gets proxy list and saves it to database
async function GetAndSaveProxies() {
    return new Promise(async function (resolve, reject) {
        try {
            let proxiesArr = await GetProxies();

            Proxy.deleteMany({}, () => {
                //Save to database
                for (let i = 0; i < proxiesArr.length; i++) {
                    let proxySplit = proxiesArr[i].split(":");
                    proxySplit[1] = parseInt(proxySplit[1]);//cast port to int

                    let proxy = new Proxy({
                        ip: proxySplit[0],
                        port: proxySplit[1]
                    });

                    proxy.save(err => { if (err) throw err; });
                    if (i == proxiesArr.length - 1) {
                        return resolve("Proxy list saved to database.")
                    }
                }
            });
        } catch (error) {
            return reject(error)
        }
    })
}

// Returns a random proxy from database
let GetProxy = async () => {
    return new Promise((resolve, reject) => {
        Proxy.countDocuments((err, count) => {
            if (count == 0) {
                return reject(false)
            }
            let rand = Math.floor(Math.random() * count);
            Proxy.findOne().skip(rand).exec((err, proxy) => {
                return resolve(proxy);
            })
        })
    })
}



module.exports.GetAndSaveProxies = GetAndSaveProxies;
module.exports.GetProxy = GetProxy;
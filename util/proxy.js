const request = require('request-promise-native');
const Proxy = require('../models/proxy');

// Returns proxy list from proxyscrape.com
async function GetProxies() {
    //let url = `https://api.proxyscrape.com/?request=getproxies&proxytype=socks4&timeout=200&country=all`
    let url = "https://api.proxyscrape.com/?request=getproxies&proxytype=socks4&timeout=1000&country=RU"
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
}

// Gets proxy list and saves it to database
async function GetAndSaveProxies() {
    try {
        let proxiesArr = await GetProxies();
        let proxies = []
        //Save to database
        for (let i = 0; i < proxiesArr.length; i++) {
            let proxySplit = proxiesArr[i].split(":");
            proxySplit[1] = parseInt(proxySplit[1]);//cast port to int

            let proxy = new Proxy({
                ip: proxySplit[0],
                port: proxySplit[1]
            });
            proxies.push(proxy);
        }

        await Proxy.deleteMany({}).exec();

        return new Promise((resolve, reject) => {
            Proxy.insertMany(proxies, (err, docs) => {
                if (err) {
                    return reject(" - could not store proxies to db")
                }
                return resolve(docs.length)
            })
        })
    } catch (error) {
        return Promise.reject(error)
    }

}

async function GetProxyCount() {
    return new Promise(resolve => [
        Proxy.countDocuments((err, count) => {
            return resolve(count);
        })
    ])
}


// Returns a random proxy from database
let GetProxy = async () => {
    let count = await GetProxyCount();

    if (count == 0) {
        return false;
    }

    let rand = Math.floor(Math.random() * count);
    return await Proxy.findOne().skip(rand).exec();
}

let RemoveProxy = async (proxy) => {
    return new Promise(resolve => {
        proxy.remove((err) => {
            if (err) {
                console.log(err)
            }
            return resolve();
        })
    })
}



module.exports.GetAndSaveProxies = GetAndSaveProxies;
module.exports.GetProxy = GetProxy;
module.exports.RemoveProxy = RemoveProxy
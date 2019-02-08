const List = require("./circular-list");
const request = require('request')

let user = "w3V23o79rDeD";
let pass = "w3bFwhoE48jP";
let limit = 5000;
let type = "socks4"
let url = `http://proxy-daily.com/api/getproxy.php?username=${user}&password=${pass}&limit=${limit}&filter=${type}`;


module.exports = GetProxies = () => {
    console.log('Getting Proxy List')
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) reject(err);

            if (body === 'Incorrect username or password!') {
                reject("Could not get proxies, incorrect username/password")
            }

            let proxies = body.split("<br>")
            let list = new List();
            list.arrayToList(proxies)
            resolve(list);
        })
    })
}
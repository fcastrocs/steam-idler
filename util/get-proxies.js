const List = require("./Linked-List");
const request = require('request')

let user = "w3V23o79rDeD";
let pass = "w3bFwhoE48jP";
let limit = 5000;
let type = "socks4"
let url = `http://proxy-daily.com/api/getproxy.php?username=${user}&password=${pass}&limit=${limit}&filter=${type}`;
const TRYLIMIT = 5
let tryCounter = 0;


let GetProxies = () => {
    console.log('Getting Proxy List...')
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) { // retry
                if (tryCounter++ == TRYLIMIT) {
                    reject(err);
                }
                console.log('retrying to get proxies')
                setTimeout(GetProxies, 5000);
                return;
            }

            if (body === 'Incorrect username or password!') {
                throw "Could not get proxies, incorrect username/password"
            }

            let proxies = body.split("<br>")
            let list = new List();
            list.arrayToList(proxies)
            resolve(list);
        })
    })
}


module.exports = GetProxies;
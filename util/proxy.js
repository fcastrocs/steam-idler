const request = require('request-promise');
const Proxy = require('../models/proxy');

module.exports.FetchAndSave = async () =>{
    let baseURL = "http://proxy-daily.com/api/getproxy.php";
    let user = "?username=opVs6lWtf7uz";
    let pass = "&password=hTDIhgBkUlOW";
    let limit = "&limit=250";
    let type = "&filter=socks4"
    let country = "&country=US"
    let url = baseURL + user + pass + limit + type + country;

    let options = {
        url: url,
        method: 'GET'
    }

    try {
        let res = await request(options);
        let proxiesArr = res.split("<br>").filter(proxy => {
            //make sure every proxy is in this format ip:port
            if ((proxy.indexOf(":") > -1)) {
                return true;
            }
            return false;
        })

        //Save to database
        for (let i = 0; i < proxiesArr.length; i++) {
            let proxySplit = proxiesArr[i].split(":");
            proxySplit[1] = parseInt(proxySplit[1]);//cast port to int

            let proxy = new Proxy({
                ip: proxySplit[0],
                port: proxySplit[1]
            });

            proxy.save(err => { if (err) throw err; });
            if(i == proxiesArr.length - 1){
                console.log('Proxies saved to database.');
            }
        }
    } catch (error) {
        console.log('Retrying to fetch proxies...')
        setTimeout(() => {
            FetchProxies()
        }, 5000);
    }
} 
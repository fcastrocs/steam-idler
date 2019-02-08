const request = require('request-promise');
const List = require('./Linked-List');

async function GetProxies() {
    let baseURL = "http://proxy-daily.com/api/getproxy.php";
    let user = "?username=opVs6lWtf7uz";
    let pass = "&password=hTDIhgBkUlOW";
    let limit = "&limit=250";
    let type = "&filter=socks4"
    let url = baseURL + user + pass + limit + type

    let options = {
        url: url,
        method: 'GET'
    }
    
    var res = await request(options);
    res = res.split("<br>").filter(proxy => {
        //make sure every proxy is in this format ip:port
        if ((proxy.indexOf(":") > -1)) {
            return true;
        }
        return false;
    })

    // make a circular linked list
    let list = new List();
    list.arrayToList(res);
    return list;
};

module.exports = async function FetchProxies() {
    try {
       let proxies = await GetProxies();
       process.env.proxies = proxies;
       console.log('proxies fetched')
    } catch (error) {
        console.log('retrying to fetch proxies')
        setTimeout(() => {
            FetchProxies()
        }, 5000);
    }
}
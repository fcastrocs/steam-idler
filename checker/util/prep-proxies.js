const List = require("./Linked-List");
const axios = require("axios");
const axiosRetry = require("axios-retry");

module.exports = GetProxies = () => {
    let user = "opVs6lWtf7uz";
    let pass = "hTDIhgBkUlOW";
    let limit = 50000;
    let type = "socks4"
    let url = `http://proxy-daily.com/api/getproxy.php?username=${user}&password=${pass}&limit=${limit}&filter=${type}`;

    axiosRetry(axios, { retries: 10, retryDelay: () => { return 2000;} });
    console.log("Proxy list loaded.")
    return axios.get(url);
};
const axios = require("axios");
const axiosRetry = require("axios-retry")

module.exports = GetBadSteamIds = (digit) => {
    axiosRetry(axios, { retries: 5, retryDelay: () => { return 2000;} });

    let url = `http://gdl.site.nfoservers.com/bad${digit}dig.txt`;
    return axios.get(url);
};
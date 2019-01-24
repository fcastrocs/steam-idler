const axios = require("axios");
const axiosRetry = require("axios-retry")

module.exports = GetSteamServers = () => {
    axiosRetry(axios, { retries: 5, retryDelay: () => { return 2000;} });
    let url = "https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?format=json&cellid=0";
    console.log("Fetched STEAM CM Servers.")
    return axios.get(url);
}
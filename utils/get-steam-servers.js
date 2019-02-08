const request = require('request-promise');

async function GetSteamServers() {
    let url = "https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?format=json&cellid=0";
    let options = {
        url: url,
        method: 'GET'
    }
    var res = await request(options);
    return JSON.parse(res).response.serverlist;
}

module.exports = async function FetchSteamCMs() {
    try {
       let proxies = await GetSteamServers();
       process.env.steamcm = proxies;
       console.log('steam CMs fetched')
    } catch (error) {
        console.log('retrying to fetch steam CMs')
        setTimeout(() => {
            FetchSteamCMs();
        }, 5000);
    }
}
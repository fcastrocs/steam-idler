const request = require('request')

let url = "https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?format=json&cellid=0";

module.exports = GetSteamCM = () => {
    console.log('Getting Steam CMs')
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) {
                reject(err);
            }
            body = JSON.parse(body)
            resolve(body.response.serverlist)
        })
    })
}
const request = require('request-promise');
const SteamCM = require('../models/steamcm')

//Fetch Steam CMs and save to database
module.exports.FetchAndSave = async () => {
    let url = "https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?format=json&cellid=0";
    let options = {
        url: url,
        method: 'GET'
    }

    try {
        let res = await request(options);
        let steamcmArr = JSON.parse(res).response.serverlist;
        
        //Save to database
        for (let i = 0; i < steamcmArr.length; i++) {
            let serverSplit = steamcmArr[i].split(":");
            serverSplit[1] = parseInt(serverSplit[1]);

            let server = new SteamCM({
                ip: serverSplit[0],
                port: serverSplit[1]
            });

            server.save(err => { if (err) throw err; });

            if (i == steamcmArr.length - 1) {
                console.log('Steam CMs saved to database.');
            }
        }
    } catch (error) {
        console.log('Retrying to fetch Steam CMs...')
        setTimeout(() => {
            FetchSteamCMs();
        }, 5000);
    }
}
const request = require('request-promise');
const SteamCM = require('../models/steamcm')

//Fetch Steam CMs and save to database
module.exports.GetAndSaveSteamCMs = async () => {
    return new Promise(async function (resolve, reject) {

        let url = "https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?format=json&cellid=0";
        let options = {
            url: url,
            method: 'GET'
        }

        try {
            let res = await request(options);
            let steamcmArr = JSON.parse(res).response.serverlist;

            SteamCM.deleteMany({}, () => {
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
                        return resolve('Steam CMs saved to database.')
                    }
                }
            });
        } catch (error) {
            reject("Could not fetch Steam CMs")
        }
    })
}


// Returns a random SteamCM from database
module.exports.GetSteamCM = async (cb) => {
    SteamCM.countDocuments((err, count) => {
        if (err) {
            throw err;
        }

        let rand = Math.floor(Math.random() * count);

        SteamCM.findOne().skip(rand).exec((err, steamcm) => {
            if (err) {
                throw err;
            }
            cb(steamcm);
        })
    });
}
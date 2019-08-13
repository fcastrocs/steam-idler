const request = require('request-promise-native');
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
                let servers = []
                //Save to database
                for (let i = 0; i < steamcmArr.length; i++) {
                    let serverSplit = steamcmArr[i].split(":");
                    serverSplit[1] = parseInt(serverSplit[1]);

                    let server = new SteamCM({
                        ip: serverSplit[0],
                        port: serverSplit[1]
                    });

                    servers.push(server)
                }

                SteamCM.insertMany(servers, (err, docs) =>{
                    if(err){
                        return reject("Could not save SteamCMS to DB.")
                    }

                    return resolve(`${docs.length} Steam CMs saved to database.`)
                })
            });
        } catch (error) {
            reject("Could not fetch Steam CMs.")
        }
    })
}


// Returns a random SteamCM from database
module.exports.GetSteamCM = async () => {
    return new Promise((resolve, reject) => {
        SteamCM.countDocuments((err, count) => {
            if (count == 0) {
                return reject(false)
            }
            let rand = Math.floor(Math.random() * count);
            SteamCM.findOne().skip(rand).exec((err, steamcm) => {
                return resolve(steamcm);
            })
        })
    })
}
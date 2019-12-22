/* eslint-disable no-async-promise-executor */
/* eslint-disable require-atomic-updates */
const Request = require("request-promise-native")
const SocksProxyAgent = require('socks-proxy-agent');
const SteamCrypto = require("@doctormckay/steam-crypto")
const cheerio = require('cheerio')
const Crypto = require('crypto');

// Steam website 
const STEAMCOMMUNITY_TIMEOUT = 10000
const STEAMCOMMUNITY_RETRY_DELAY = 3000

// 2019 winter sale nominations
const votes = [
    {
        voteid: 34,
        appid: 814380
    },
    {
        voteid: 35,
        appid: 991260
    },
    {
        voteid: 36,
        appid: 570
    },
    {
        voteid: 37,
        appid: 221100
    },
    {
        voteid: 38,
        appid: 646570
    },
    {
        voteid: 39,
        appid: 1097840
    },
    {
        voteid: 40,
        appid: 976310
    },
    {
        voteid: 41,
        appid: 848450
    },
]


/**
 * Generate a web cookie from nonce
 * @param {*} nonce given by steam after authentication
 * @returns web cookie
 */
module.exports.GenerateWebCookie = function (nonce) {
    if (!this.loggedIn) {
        return Promise.reject()
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }
            retries++;
            // too many tries, get a new proxy
            if (retries == 3) {
                return reject();
            }

            let sessionKey = SteamCrypto.generateSessionKey();
            let encryptedNonce = SteamCrypto.symmetricEncryptWithHmacIv(nonce, sessionKey.plain);

            let data = {
                steamid: self.account.steamid,
                sessionkey: sessionKey.encrypted,
                encrypted_loginkey: encryptedNonce
            };

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://api.steampowered.com/ISteamUserAuth/AuthenticateUser/v1`,
                method: 'POST',
                agent: agent,
                formData: data,
                json: true,
                timeout: STEAMCOMMUNITY_TIMEOUT
            }

            try {
                let data = await Request(options);
                if (!data.authenticateuser) {
                    setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
                } else {
                    let sessionId = Crypto.randomBytes(12).toString('hex')
                    self.sessionId = sessionId;
                    let steamLogin = data.authenticateuser.token
                    let steamLoginSecure = data.authenticateuser.tokensecure
                    let cookie = `sessionid=${sessionId}; steamLogin=${steamLogin}; steamLoginSecure=${steamLoginSecure}; birthtime=-2021828399; lastagecheckage=7-0-1906;`
                    return resolve(cookie);
                }
            } catch (error) {
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }

        })();
    })
}

/**
 * Get card farming data 
 * @returns Promise with array containing items { title, appId, playTime, cardsRemaining }
 */
module.exports.GetFarmingData = function () {
    if (!this.webCookie) {
        return Promise.reject()
    }

    if (!this.loggedIn) {
        return Promise.reject()
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }

            retries++;

            // too many tries, get a new proxy
            if (retries == 3) {
                return reject();
            }

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://steamcommunity.com/profiles/${self.account.steamid}/badges`,
                method: 'GET',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": self.webCookie
                }
            }

            try {
                let data = await Request(options)
                return resolve(self.ParseFarmingData(data));
            } catch (error) {
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}

/**
 * Helper function for GetFarmingData()
 * @param {*} data raw html card farming data
 * @returns array containing items { title, appId, playTime, cardsRemaining }
 */
module.exports.ParseFarmingData = function (data) {
    const $ = cheerio.load(data, { decodeEntities: false });

    let farmingData = [];

    $(".badge_row").each(function () {
        // check for remaining cards
        let progress = $(this).find(".progress_info_bold").text();
        if (!progress) {
            return;
        }

        progress = Number(progress.replace(/[^0-9.]+/g, ""));
        if (progress === 0) {
            return;
        }

        // Get play time
        let playTime = $(this).find(".badge_title_stats_playtime").text();
        if (!playTime) {
            return;
        }
        playTime = Number(playTime.replace(/[^0-9.]+/g, ""));


        // Get game title
        $(this).find(".badge_view_details").remove();
        let gameTitle = $(this).find(".badge_title").text();
        if (!gameTitle) {
            return;
        }
        gameTitle = gameTitle.replace(/&nbsp;/g, '')
        gameTitle = gameTitle.trim();

        // Get appID
        let link = $(this).find(".badge_row_overlay").attr("href")
        link = link.substring(link.indexOf("gamecards"), link.length);
        let appId = Number(link.replace(/[^0-9.]+/g, ""));

        let obj = {
            title: gameTitle,
            appId: appId.toString(),
            playTime: playTime,
            cardsRemaining: progress
        }

        farmingData.push(obj)
    })
    return farmingData;
}


module.exports.waitUntilLoggedIn = function () {
    let self = this;
    return new Promise(resolve => {
        (function check() {
            if (self.fullyLoggedIn) {
                return resolve();
            }
            setTimeout(() => check(), 5000);
        })();
    });
}


/**
 * 2019 winter even nominate games
 */
module.exports.nominateGames = async function () {
    if (!this.currentVote) {
        this.currentVote = 0;
    }

    let self = this;
    if (!self.fullyLoggedIn) {
        return Promise.reject("Account is not logged in");
    }

    for (; this.currentVote < votes.length; this.currentVote++) {
        await castVote(this.currentVote);
        console.log("Casted vote: " + (this.currentVote + 1));
    }

    console.log("Casted all votes successfully");
    return Promise.resolve();


    function castVote(i) {
        let retries = 0;
        return new Promise(async resolve => {
            (async function tryVote() {
                // too many tries, renew the connection
                if (retries >= 3) {
                    console.log("VOTE " + (i + 1) + " FAILED, RENEWING CONNECTION.");
                    self.fullyLoggedIn = false;
                    setTimeout(() => {
                        self.RenewConnection("need new cookie");
                    }, 30000);
                    await self.waitUntilLoggedIn();
                    retries = 0;
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let options = {
                    url: `https://store.steampowered.com/salevote`,
                    method: 'POST',
                    agent: agent,
                    timeout: STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "User-Agent": "Valve/Steam HTTP Client 1.0",
                        "Cookie": self.webCookie
                    },
                    formData: {
                        "sessionid": self.sessionId,
                        "voteid": votes[i].voteid,
                        "appid": votes[i].appid,
                        "developerid": 0
                    }
                }

                try {
                    await Request(options);
                    return resolve();
                } catch (error) {
                    console.log("Vote " + (i + 1) + " failed, retrying...");
                    retries++;
                    setTimeout(() => {
                        tryVote();
                    }, 6000);
                }
            })();
        })
    }
}


module.exports.viewDiscoveryQueue = async function () {
    let self = this;
    if (!self.fullyLoggedIn) {
        return Promise.reject("Account is not logged in");
    }

    await setMaturity(5);
    console.log("Maturity option 5 set");
    await setMaturity(2);
    console.log("Maturity option 2 set");
    await setMaturity(1);
    console.log("Maturity option 1 set");
    await setMaturity(3);
    console.log("Maturity option 3 set");

    // do three queue discoveries
    for (let i = 0; i < 3; i++) {
        let queue = await getQueue(i + 1);
        console.log("Got queue " + (i + 1));

        for (let j = 0; j < queue.length; j++) {
            await clearFromQueue(queue[j]);
            console.log("cleared appid " + queue[j])
        }
        console.log("Queue " + (i + 1) + " clearned.");
    }

    function setMaturity(descid) {
        let retries = 0;
        return new Promise(async resolve => {
            (async function trySetMaturity() {
                // too many tries, renew the connection
                if (retries >= 3) {
                    console.log("COULD NOT SET MATURITY OPTION " + descid);
                    self.fullyLoggedIn = false;
                    setTimeout(() => {
                        self.RenewConnection("need new cookie");
                    }, 10000);
                    await self.waitUntilLoggedIn();
                    retries = 0;
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let options = {
                    url: `https://store.steampowered.com/account/saveonecontentdescriptorpreference`,
                    method: 'POST',
                    agent: agent,
                    timeout: STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "User-Agent": "Valve/Steam HTTP Client 1.0",
                        "Cookie": self.webCookie
                    },
                    formData: {
                        "sessionid": self.sessionId,
                        "descid": descid,
                        "hide": 0
                    }
                }

                try {
                    await Request(options);
                    return resolve();
                } catch (error) {
                    console.log("Could not set maturity option " + descid + ", retrying...");
                    retries++;
                    setTimeout(() => {
                        trySetMaturity();
                    }, STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })

    }

    function clearFromQueue(appid) {
        let retries = 0;
        return new Promise(async resolve => {
            (async function tryClear() {
                // too many tries, renew the connection
                if (retries >= 3) {
                    console.log("CLEARING APPID " + appid + " FAILED, RENEWING CONNECTION.");
                    self.fullyLoggedIn = false;
                    setTimeout(() => {
                        self.RenewConnection("need new cookie");
                    }, 10000);
                    await self.waitUntilLoggedIn();
                    retries = 0;
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let options = {
                    url: `https://store.steampowered.com/app/${appid}`,
                    method: 'POST',
                    agent: agent,
                    timeout: STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "User-Agent": "Valve/Steam HTTP Client 1.0",
                        "Cookie": self.webCookie
                    },
                    formData: {
                        "sessionid": self.sessionId,
                        "appid_to_clear_from_queue": appid,
                        "snr": "1_5_9__1324"
                    }
                }

                try {
                    await Request(options);
                    return resolve();
                } catch (error) {
                    console.log("Clearing appid " + appid + " failed, retrying...");
                    retries++;
                    setTimeout(() => {
                        tryClear();
                    }, STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }

    function getQueue(i) {
        let retries = 0;
        return new Promise(async resolve => {
            (async function tryGetQueue() {
                // too many tries, renew the connection
                if (retries >= 3) {
                    console.log("GETTING QUEUE FAILED " + i + ", RENEWING CONNECTION.");
                    self.fullyLoggedIn = false;
                    setTimeout(() => {
                        self.RenewConnection("need new cookie");
                    }, 10000);
                    await self.waitUntilLoggedIn();
                    retries = 0;
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let options = {
                    url: `https://store.steampowered.com/explore/generatenewdiscoveryqueue`,
                    method: 'POST',
                    agent: agent,
                    timeout: STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "User-Agent": "Valve/Steam HTTP Client 1.0",
                        "Cookie": self.webCookie
                    },
                    formData: {
                        "sessionid": self.sessionId,
                        "queuetype": 0
                    }
                }

                try {
                    let res = await Request(options);
                    res = JSON.parse(res);
                    return resolve(res.queue);
                } catch (error) {
                    console.log("Could not get queue " + i + ", retrying...");
                    retries++;
                    setTimeout(() => {
                        tryGetQueue();
                    }, STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }
}

/**
 * Get Inventory data
 * @returns Promise with array inventory data
 */
module.exports.GetIventory = function () {
    if (!this.webCookie) {
        return Promise.reject()
    }

    if (!this.loggedIn) {
        return Promise.reject()
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }

            retries++;

            // too many tries, get a new proxy
            if (retries == 3) {
                return reject();
            }

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://steamcommunity.com/profiles/${self.account.steamid}/inventory/json/753/6`,
                method: 'GET',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": self.webCookie
                }
            }

            try {
                let inventory = await Request(options)
                inventory = JSON.parse(inventory);
                if (!inventory.success) {
                    setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
                }

                if (inventory.rgDescriptions.length == 0) {
                    return resolve(null);
                }

                return resolve(inventory.rgDescriptions);
            } catch (error) {
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}

/**
* Change avatar
* @param {*} binaryImg 
* @param {*} filename
* @returns promise with avatar url
*/
module.exports.changeAvatar = function (binaryImg, filename) {
    if (!this.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    if (!this.webCookie) {
        return Promise.reject("Account doesn't have a webcookie.")
    }

    // convert binary image data to buffer 
    let buffer = new Buffer.from(binaryImg, "binary");
    let contentType;
    // set the correct contenttype
    let ext = filename.substring(7);
    if (ext === "jpg") {
        contentType = "image/jpeg"
    } else {
        contentType = `image/${ext}`
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }

            retries++;

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: "https://steamcommunity.com/actions/FileUploader",
                method: 'POST',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                json: true,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": self.webCookie
                },
                formData: {
                    "MAX_FILE_SIZE": buffer.length,
                    "type": "player_avatar_image",
                    "sId": self.account.steamid,
                    "sessionid": self.sessionId,
                    "doSub": 1,
                    "json": 1,
                    "avatar": {
                        "value": buffer,
                        "options": {
                            "filename": filename,
                            "contentType": contentType
                        }
                    }
                }
            }

            try {
                let res = await Request(options)
                if (res.success) {
                    return resolve(res.images.full)
                } else {
                    if (retries > 3) {
                        return reject("Could not upload avatar, try again.")
                    }
                    setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
                }
            } catch (error) {
                if (retries > 3) {
                    return reject("Could not upload avatar, try again.")
                }
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}

/**
 * Clear previous aliases
 */
module.exports.clearAliases = function () {
    if (!this.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    if (!this.webCookie) {
        return Promise.reject("Account doesn't have a webcookie.")
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }

            retries++;

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://steamcommunity.com/profiles/${self.account.steamid}/ajaxclearaliashistory/`,
                method: 'POST',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                json: true,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": self.webCookie
                },
                formData: { "sessionid": self.sessionId }
            }

            try {
                let res = await Request(options)
                if (res.success === 1) {
                    return resolve()
                } else {
                    if (retries > 3) {
                        return reject("Could not clear previous aliases, try again.")
                    }
                    setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
                }
            } catch (error) {
                if (retries > 3) {
                    return reject("Too many retries, could not clear aliases.")
                }
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}

/**
 * Change privacy settings
 * @param {*} formData containing privacy settings
 */
module.exports.changePrivacy = function (formData) {
    if (!this.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    if (!this.webCookie) {
        return Promise.reject("Account doesn't have a webcookie.")
    }

    if (!formData) {
        return Promise.reject("formData not passed.")
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }

            retries++;

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://steamcommunity.com/profiles/${self.account.steamid}/ajaxsetprivacy/`,
                method: 'POST',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                json: true,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": self.webCookie
                },
                formData: {
                    "sessionid": self.sessionId,
                    'Privacy': JSON.stringify(formData.Privacy),
                    "eCommentPermission": formData.eCommentPermission
                }
            }

            try {
                let res = await Request(options)
                if (res.success === 1) {
                    return resolve()
                } else {
                    if (retries > 3) {
                        return reject("Could not set privacy settings, try again.")
                    }
                    setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
                }
            } catch (error) {
                if (retries > 3) {
                    return reject("Could not set privacy settings, try again.")
                }
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}

/**
 * Activate free game
 * @param {*} packageId packageId containing the free game
 * @returns Promise with game activated
 */
module.exports.activateFreeGame = function (packageId) {
    if (!this.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    if (!this.webCookie) {
        return Promise.reject("Account doesn't have a webcookie.")
    }

    if (!packageId) {
        return Promise.reject("packageId not passed.")
    }

    let self = this;
    return new Promise((resolve, reject) => {
        (async function attempt(retries) {
            if (!retries) {
                retries = 0;
            }

            retries++;

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://store.steampowered.com/checkout/addfreelicense/`,
                method: 'POST',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                json: true,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": self.webCookie
                },
                formData: {
                    "snr": "1_5_9__403",
                    "action": "add_to_cart",
                    "sessionid": self.sessionId,
                    "subid": packageId
                }
            }

            try {
                let res = await Request(options)
                const $ = cheerio.load(res);
                // game activated
                if ($("title").text() === "Purchase") {
                    self.client.GetPkgInfo([packageId], appIds => {
                        self.client.GetAppInfo(appIds, games => {
                            return resolve(games);
                        })
                    })
                } else {
                    return reject("Count not activate this game, check you entered the correct package ID.")
                }
            } catch (error) {
                if (retries > 3) {
                    return reject("Could not activate free game, try again.")
                }
                setTimeout(() => attempt(retries), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}
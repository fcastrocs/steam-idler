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
 * Resolves until account is fully logged in.
 */
module.exports.waitUntilFullyLoggedIn = function () {
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
 * Generate a web cookie from nonce.
 * @param {*} nonce given by steam after authentication
 * @returns web cookie
 */
module.exports.GenerateWebCookie = function (nonce) {
    let self = this;
    if (!self.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    let retries = 0;
    return new Promise(async (resolve, reject) => {
        (async function tryAuthenticate() {
            // too many tries, renew the connection
            if (retries >= 5) {
                return reject("Could not get cookie");
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
                    setTimeout(() => tryAuthenticate(), STEAMCOMMUNITY_RETRY_DELAY);
                } else {
                    let sessionId = Crypto.randomBytes(12).toString('hex')
                    self.sessionId = sessionId;
                    let steamLoginSecure = data.authenticateuser.tokensecure
                    let cookie = `sessionid=${sessionId}; steamLoginSecure=${steamLoginSecure};`
                    return resolve(cookie);
                }
            } catch (error) {
                retries++;
                setTimeout(() => tryAuthenticate(), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })
}

/**
 * Get card farming data 
 * @returns Promise with array containing items { title, appId, playTime, cardsRemaining }
 */
module.exports.GetFarmingData = function () {
    let self = this;
    if (!self.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    if (!self.webCookie) {
        return Promise.reject("Account doesn't have a web cookie.")
    }

    let retries = 0;
    return new Promise(async (resolve, reject) => {
        (async function tryGetFarmingData() {
            // too many tries, renew the connection
            if (retries >= 5) {
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
                    "Cookie": self.webCookie
                }
            }

            try {
                let data = await Request(options)
                return resolve(parseFarmingData(data));
            } catch (error) {
                retries++;
                setTimeout(() => tryGetFarmingData(), STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })

    /**
     * Helper function for GetFarmingData()
     * @param {*} data raw html card farming data
     * @returns array containing items { title, appId, playTime, cardsRemaining }
     */
    function parseFarmingData(data) {
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
}

/**
 * 2019 winter event nominate games
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
                if (retries >= 5) {
                    console.error("vote " + (i + 1) + " failed, renewing connection.");
                    self.RenewConnection("need new cookie");
                    await self.waitUntilFullyLoggedIn();
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
                    retries++;
                    setTimeout(() => {
                        tryVote();
                    }, STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }
}

/**
 * 2019 winter event view 3 discovery queues
 */
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
                if (retries >= 5) {
                    console.error("Could not set maturity option " + descid);
                    self.RenewConnection("need new cookie");
                    await self.waitUntilFullyLoggedIn();
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
                        "Cookie": self.webCookie + " birthtime=-2021828399; lastagecheckage=7-0-1906;"
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
                if (retries >= 5) {
                    console.error("Clearing appid " + appid + " failed, renewing connection.");
                    self.RenewConnection("need new cookie");
                    await self.waitUntilFullyLoggedIn();
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
                        "Cookie": self.webCookie + " birthtime=-2021828399; lastagecheckage=7-0-1906;"
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
                if (retries >= 5) {
                    console.log("Getting queue " + i + " failed, renewing connection.");
                    self.RenewConnection("need new cookie");
                    await self.waitUntilFullyLoggedIn();
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
                        "Cookie": self.webCookie + " birthtime=-2021828399; lastagecheckage=7-0-1906;"
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
 */
module.exports.getInventory = async function (mode) {
    let self = this;
    if (!self.webCookie) {
        return Promise.reject("Account does not have a cookie.")
    }

    if (!self.loggedIn) {
        return Promise.reject("Account is not logged in.")
    }

    let retries = 0;
    return new Promise(async (resolve, reject) => {
        let gotSteamCards = false
        let items = [];

        (async function tryGetInventory() {
            // too many tries, renew the connection
            if (retries >= 5) {
                if (mode === "let fail") {
                    return reject();
                }

                self.RenewConnection("inventory");
                await self.waitUntilFullyLoggedIn();
                retries = 0;
            }

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://steamcommunity.com/profiles/${self.account.steamid}/inventory/json/753/6`,
                method: 'GET',
                agent: agent,
                timeout: STEAMCOMMUNITY_TIMEOUT,
                headers: {
                    "Cookie": self.webCookie
                }
            }

            try {
                let data = null;

                if(gotSteamCards){
                     // get inventory/json/753/6  <-- steam cards
                    data = await Request(options)
                    data = JSON.parse(data);
                    // Check for empty inventory
                    if (!Array.isArray(data.rgInventory)) {
                        parseInventory(items, data, "6");
                    }
                    gotSteamCards = true;
                }
                

                // get inventory/json/753/1  <-- gifts
                options.url = `https://steamcommunity.com/profiles/${self.account.steamid}/inventory/json/753/1`,
                data = await Request(options)
                data = JSON.parse(data);
                // Check for empty inventory
                if (!Array.isArray(data.rgInventory)) {
                    parseInventory(items, data, "6");
                }

                return resolve(items);
            } catch (error) {
                retries++;
                setTimeout(() => {
                    tryGetInventory();
                }, STEAMCOMMUNITY_RETRY_DELAY);
            }
        })();
    })

    function parseInventory(items, data, contextid) {
        let inventory = data.rgInventory;
        let description = data.rgDescriptions;

        for (const key in inventory) {
            let item = {}
            let c_i = inventory[key].classid + "_" + inventory[key].instanceid;

            item.assetid = inventory[key].id;
            item.amount = inventory[key].amount;
            item.icon = description[c_i].icon_url;
            item.name = description[c_i].name;
            item.type = description[c_i].type;
            item.tradable = description[c_i].tradable;
            item.contextid = contextid;
            items.push(item);
        }
    }
}

/**
 * Send trade offer
 */
module.exports.sendOffer = async function (steamId, token, offer, tradeUrl) {
    let self = this;
    if (!self.fullyLoggedIn) {
        return Promise.reject("Account is not logged in");
    }

    let res = await trysendOffer();
    return Promise.resolve(res);

    function trysendOffer() {
        let retries = 0;
        return new Promise((resolve, reject) => {
            (async function attempt() {
                // too many tries, renew the connection
                if (retries >= 5) {
                    console.error("Sending trade offer failed, renewing connection.");
                    self.RenewConnection("trade offer");
                    await self.waitUntilFullyLoggedIn();
                    retries = 0;
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let params = {
                    "trade_offer_access_token": token
                }

                let data = {
                    "sessionid": self.sessionId,
                    "serverid": 1,
                    "partner": steamId,
                    "tradeoffermessage": "",
                    "json_tradeoffer": JSON.stringify(offer),
                    "captcha": "",
                    "trade_offer_create_params": JSON.stringify(params),
                }

                let options = {
                    url: "https://steamcommunity.com/tradeoffer/new/send",
                    method: 'POST',
                    agent: agent,
                    timeout: STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "Referer": tradeUrl,
                        "Cookie": self.webCookie,
                    },
                    json: true,
                    formData: data,
                    gzip: true
                }

                try {
                    let res = await Request(options);
                    console.log(`${self.account.user} > Trade offer sent`)
                    if (res.needs_mobile_confirmation) {
                        return resolve("Offer sent, needs mobile confirmation.");
                    }
                    return resolve(`Offer sent, needs email confirmation @${res.email_domain}.`);
                } catch (error) {
                    console.log(error)
                    if (error.statusCode) {
                        if (error.statusCode == 500) {
                            console.error(`${self.account.user} > Trade offer status code: ${error.statusCode}`)
                            return reject("Trade restrictions on either party, or the other party has a private inventory.")
                        }
                        console.error(`${self.account.user} > Trade offer status code: ${error.statusCode}`)
                        return reject("errorcode: " + error.statusCode)
                    }

                    retries++;
                    setTimeout(() => {
                        attempt();
                    }, STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }
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
                headers: {
                    "Cookie": self.webCookie
                },
                json: true,
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
                headers: {
                    "Cookie": self.webCookie
                },
                json: true,
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
                headers: {
                    "Cookie": self.webCookie
                },
                json: true,
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
                headers: {
                    "Cookie": self.webCookie
                },
                json: true,
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
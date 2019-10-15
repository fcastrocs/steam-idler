"use strict";

const Steam = require('./index')
const EventEmitter = require('events').EventEmitter;
const GetProxy = require('../util/proxy').GetProxy;
const GetSteamCM = require('../util/steamcm').GetSteamCM
const RemoveProxy = require("../util/proxy").RemoveProxy
const GetAndSaveProxies = require('../util/proxy').GetAndSaveProxies;
const Crypto = require('crypto');
const SteamTotp = require('steam-totp');
const Request = require("request-promise-native")
const SocksProxyAgent = require('socks-proxy-agent');
const SteamCrypto = require("@doctormckay/steam-crypto")
const cheerio = require('cheerio')
const io = require("../app").io;

class Client extends EventEmitter {
    constructor(loginOptions, socketId) {
        super();

        this.fetchingProxies = false;
        this.socketId = socketId

        // copy login options obj
        this.account = {}
        Object.assign(this.account, loginOptions);

        this.STEAMCOMMUNITY_TIMEOUT = 4500
        this.STEAMCOMMUNITY_RETRY_DELAY = 1000
        this.CONNECTION_TIMEOUT = 5 // in seconds
        this.CONNECT_DELAY = 30  // maximum delay in seconds
        this.RECONNECT_DELAY = 15

        // set proper login delay
        if (this.account.noLoginDelay) {
            var timeout = 0
        } else {
            var timeout = Math.floor(Math.random() * this.CONNECT_DELAY)
        }

        if (this.socketId) {
            io.to(`${this.socketId}`).emit("login-log-msg", "Connecting to Steam.");
        }
        setTimeout(() => this.connect(), timeout * 1000);
    }

    /**
     * Attempts steam login, must be connected to steam first.
     */
    login() {
        let self = this;

        // Setup login options
        let loginOption = {
            account_name: this.account.user,
            password: this.account.pass,
            supports_rate_limit_response: true,
            client_os_type: 16,
            ping_ms_from_cell_search: 4 + Math.floor(Math.random() * 60)

        }

        // Login with sentry file
        if (this.account.sentry) {
            loginOption.sha_sentryfile = this.account.sentry
        }

        // Email code
        if (this.account.emailGuard) {
            loginOption.auth_code = this.account.emailGuard;
        }

        //Generate mobile code if needed
        if (this.account.shared_secret) {
            loginOption.two_factor_code = SteamTotp.generateAuthCode(this.account.shared_secret);
        }

        // LOGIN RESPONSE
        this.client.once('logOnResponse', async (res) => {
            let code = res.eresult
            let errMsg = ""

            // SUCCESSFUL LOGIN
            if (code == 1) {
                self.loggedIn = true;

                self.account.steamid = res.client_supplied_steamid;

                // generate web cookie
                try {
                    self.webCookie = await self.GenerateWebCookie(res.webapi_authenticate_user_nonce);
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Received web cookie.");
                    }
                } catch (error) {
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Could not get web cookie, retrying with new proxy.");
                    }

                    // could not generate web cookie, account will relogin.
                    self.RenewConnection("cookie")
                    return;
                }

                try {
                    var farmingData = await self.GetFarmingData();
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Received Steam cards data.");
                    }
                } catch (error) {
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Could not get Steam cards data, retrying with new proxy.");
                    }

                    // could not get farming data, account will relogin.
                    self.RenewConnection("farming data")
                    return;
                }

                // Get inventory 
                try {
                    var inventory = await self.GetIventory();

                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Received inventory data.");
                    }
                } catch (error) {
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Could not get inventory data, retrying with new proxy.");
                    }

                    self.RenewConnection("inventory")
                    return
                }

                // notify connection has been gained after connection lost
                if (self.reconnecting) {
                    self.reconnecting = false;
                    self.emit("connection-gained");
                }

                // Set persona
                if (!self.account.forcedStatus) {
                    self.account.forcedStatus = "Online"
                }
                self.setPersona(self.account.forcedStatus)

                console.log(`Steam Login > user: ${self.account.user}`)

                self.emit("login-res", {
                    steamid: self.account.steamid,
                    farmingData: farmingData || [],
                    inventory: inventory || null
                })

                if (this.socketId) {
                    io.to(`${this.socketId}`).emit("login-log-msg", "Successful login.");
                }

                // After login, account should have a reconnect delay
                self.account.noLoginDelay = false;
                // After login, don't send more messages
                this.socketId = null;

                // not a new account anymore, this will cause for code 88 retries
                self.account.newAccount = false;
                return;
            }

            else if (code == 5) {
                errMsg = "Bad User/Pass."
            }

            // EMAIL GUARD 
            else if (code == 63 || code == 65) {
                this.dontReconnect = true;

                if (this.socketId) {
                    if (code == 63) {
                        io.to(`${this.socketId}`).emit("add-acc-error-msg", "Email guard code needed.");
                    }
                    else {
                        io.to(`${this.socketId}`).emit("add-acc-error-msg", "Invalid email guard code.");
                    }

                    io.sockets.sockets[this.socketId].once("email-guard", code => {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Email guard code received, retrying.");
                        this.dontReconnect = false;
                        this.account.emailGuard = code;
                        self.connect({ usePrevious: true });
                    })
                }
                return;
            }
            // RATE LIMIT
            else if (code == 84) {
                if (this.socketId && !this.badProxyMsgSent) {
                    this.badProxyMsgSent = true;
                    io.to(`${this.socketId}`).emit("login-log-msg", "Bad proxy, re-attemping login. (This may take some time)");
                }

                self.RenewConnection("rate limit")
                return;
            }

            // 2FA
            else if (code == 85) {
                errMsg = "2FA code needed."
            }

            else if (code == 88) {
                errMsg = "Invalid shared secret."

                // only keep retrying if request did not come from addAccount
                if (!self.account.newAccount) {
                    self.RenewConnection(errMsg)
                    return;
                }
            }
            // Some other error code
            else {
                if (this.socketId) {
                    io.to(`${this.socketId}`).emit("login-log-msg", "Bad Steam CM, trying another one.");
                }

                console.log(`Login failed code: ${code} > user: ${self.account.user}`)
                self.RenewConnection(`code ${code}`)
                return;
            }

            if (this.socketId) {
                io.to(`${this.socketId}`).emit("login-log-msg", errMsg);
            }

            self.loggedIn = false;
            console.log(`${errMsg} > user: ${self.account.user}`)
            self.emit("loginError", errMsg);
            self.Disconnect();
        });

        this.client.once('games', games => {
            self.emit("games", games);

            if (this.socketId) {
                io.to(`${this.socketId}`).emit("login-log-msg", "Received games.");
            }
        })

        this.client.once("persona-name", persona_name => {
            self.emit("persona-name", persona_name)

            if (this.socketId) {
                io.to(`${this.socketId}`).emit("login-log-msg", "Received persona name.");
            }
        })

        this.client.once("avatar", avatar => {
            self.emit("avatar", avatar)

            if (this.socketId) {
                io.to(`${this.socketId}`).emit("login-log-msg", "Received avatar.");
            }
        })

        // sentry
        this.client.once('updateMachineAuth', (sentry, callback) => {
            // Do not reaccept sentry if we have one already
            if (self.account.sentry) {
                console.log(`Sentry denied > user: ${self.account.user}`)
                return;
            }

            // get SHA1
            let shasum = Crypto.createHash('sha1');
            shasum.end(sentry.bytes);
            sentry = shasum.read();

            // accept sentry
            callback({ sha_file: sentry });
            // store sentry for relogins
            self.account.sentry = sentry;
            // clear email guard
            self.account.emailGuard = null

            if (this.socketId) {
                io.to(`${this.socketId}`).emit("login-log-msg", "Received sentry.");
            }

            self.emit("sentry", sentry);
        });

        // Login to steam
        this.client.LogOn(loginOption);
    }

    /**
     * Establishes steam connection
     * @param {*} options connection options
     */
    async connect(options) {
        let self = this;

        // Get a SteamCM, use previous proxy if options.usePrevious is set
        if (!options || !options.usePrevious) {
            this.steamcm = await GetSteamCM();
            this.proxy = await GetProxy();

            // proxy list is empty, fetch more proxies.
            if(!this.proxy){
                // havent started fetching a new list
                if(process.env.fetchingProxies === "false"){
                    console.log("Steam is down, getting a new proxy list in 14 mins");
                    process.env.fetchingProxies = "true";
                    setTimeout(async () => {
                        await GetAndSaveProxies();
                        process.env.fetchingProxies = "false";
                    }, 14 * 60 * 1000);
                    return;
                }else{
                    // reconnect in between 15 to 20 mins
                    let mins = (Math.random() * (20.0 - 15.0) + 15.0).toFixed(2);
                    timeout = Math.floor(mins * 60 * 1000);
                    console.log(`Steam is down, waiting ${mins} mins until reconnect > ${this.account.user}`);
                    setTimeout(() => self.connect(), timeout);
                    return;
                }
            }
        }

        // connection options
        this.options = {
            timeout: this.CONNECTION_TIMEOUT * 1000, //timeout for bad proxy
            proxy: {
                ipaddress: this.proxy.ip,
                port: this.proxy.port,
                type: 4
            },
            destination: {
                host: this.steamcm.ip,
                port: this.steamcm.port
            }
        }

        // Create the steam client
        this.client = new Steam(self.options);

        // SUCCESSFUL CONNECTION
        self.client.once('connected', () => {
            if (this.socketId && !this.loginMessageSent) {
                // don't send more "successful connection" messages after the first one
                this.loginMessageSent = true;
                io.to(`${this.socketId}`).emit("login-log-msg", "Connected to Steam, attemping login.");
            }
            self.login();
        })

        // CONNECTION LOST
        self.client.once('error', err => {
            // wait for email guard, don't reconnect;
            if (this.dontReconnect) {
                return;
            }

            // notify connection has been lost
            if (self.loggedIn) {
                self.reconnecting = true;
                self.emit("connection-lost");
            }
            self.RenewConnection(err);
        })

        // connect to steam
        try {
            await self.client.Connect();
        } catch (err) {
            // bad proxy
            self.RenewConnection(err);
        }
    }

    /**
     * Reconnecto to steam
     * @param {*} err error that triggered reconnection
     */
    RenewConnection(err) {
        this.Disconnect();

        // Remove the proxy
        RemoveProxy(this.proxy);

        if (this.account.noLoginDelay) {
            var timeout = 0 // only do 1 second
        } else {
            var timeout = Math.floor(Math.random() * this.RECONNECT_DELAY)
        }
        console.log(`Reconnecting in ${timeout} sec: ${err} > user: ${this.account.user} | proxy IP: ${this.proxy.ip}`)
        setTimeout(() => this.connect(), timeout * 1000);
    }

    /**
     * Disconnect from steam
     */
    Disconnect() {
        this.loggedIn = false;
        this.webCookie = false;
        this.client.Disconnect();
    }


        /**
     * Change avatar
     * @param {*} binaryImg 
     * @param {*} filename
     * @returns promise with avatar url
     */
    async changeAvatar(binaryImg, filename) {
        if (!this.loggedIn) {
            return Promise.reject("Account is not logged in.")
        }

        if (!this.webCookie) {
            return Promise.reject("Account doesn't have a webcookie.")
        }

        // convert binary image data to buffer 
        let buffer = new Buffer.from(binaryImg, "binary");

        // set the correct contenttype
        let ext = filename.substring(7);
        if (ext === "jpg") {
            var contentType = "image/jpeg"
        } else {
            var contentType = `image/${ext}`
        }

        let self = this;
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT,
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
                        setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                    }
                } catch (error) {
                    if (retries > 3) {
                        return reject("Could not upload avatar, try again.")
                    }
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }

    /**
     * Clear previous aliases
     */
    async clearAliases() {
        if (!this.loggedIn) {
            return Promise.reject("Account is not logged in.")
        }

        if (!this.webCookie) {
            return Promise.reject("Account doesn't have a webcookie.")
        }

        let self = this;
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT,
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
                        setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                    }
                } catch (error) {
                    if (retries > 3) {
                        return reject("Too many retries, could not clear aliases.")
                    }
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }

    /**
     * Change privacy settings
     * @param {*} formData containing privacy settings
     */
    async changePrivacy(formData) {
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
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT,
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
                        setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                    }
                } catch (error) {
                    if (retries > 3) {
                        return reject("Could not set privacy settings, try again.")
                    }
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }

    /**
     * Activate free game
     * @param {*} packageId packageId containing the free game
     * @returns Promise with game activated
     */
    activateFreeGame(packageId) {
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
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT,
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
                            console.log(appIds)
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
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }
    
    /**
     * Sets account to play games or to stop playing games if empty array
     * @param {*} games games array to play
     * @returns account status: "In-game" or "Online"
     */
    playGames(games) {
        if (!this.loggedIn) {
            return;
        }
        this.client.playGames(games);

        if (games.length > 0) {
            return "In-game"
        } else {
            return "Online"
        }
    }

    /**
     * Activate F2P games
     * @param {*} appIds array of appIDs to activate
     * @returns Promise with activated games
     */
    activateF2pGames(appIds) {
        if (!this.loggedIn) {
            return;
        }

        return new Promise((resolve, reject) => {
            // register the event first
            this.client.once('activated-f2p-games', games => {
                if (!games) {
                    reject("Could not activate game(s).")
                } else {
                    resolve(games)
                }
            })
            this.client.activateF2pGames(appIds)
        })
    }
    
    /**
     * Redeem a cdkey
     * @param {*} cdkey
     * @returns activated game
     */
    redeemKey(cdkey) {
        if (!this.loggedIn) {
            return;
        }

        return new Promise((resolve, reject) => {
            // register the event first
            this.client.once('redeem-key', games => {
                if (Array.isArray(games)) {
                    resolve(games)
                } else {
                    reject(games)
                }
            })
            this.client.redeemKey(cdkey)
        })
    }
    
    /**
     * Change account status
     * @param {*} state Offline: 0, Online: 1, Busy: 3, Away: 3, Snooze: 4,
     * LookingToTrade: 5, LookingToPlay: 6, Invisible: 7
     * @param {*} name Optional, persona name
     */
    setPersona(state, name) {
        if (!this.loggedIn) {
            return;
        }
        // Save status if account loses connection
        this.account.forcedStatus = state;
        if (state == "Online") {
            state = 1;
        } else if (state == "Busy") {
            state = 2;
        } else if (state == "Away") {
            state = 3;
        } else if (state == "Invisible") {
            state = 7
        }

        this.client.setPersona(state, name)
    }
    
    /**
     * Generate a web cookie from nonce
     * @param {*} nonce given by steam after authentication
     * @returns web cookie
     */
    async GenerateWebCookie(nonce) {
        if (!this.loggedIn) {
            return Promise.reject()
        }

        let self = this;
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT
                }

                try {
                    let data = await Request(options);
                    if (!data.authenticateuser) {
                        setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                    } else {
                        let sessionId = Crypto.randomBytes(12).toString('hex')
                        self.sessionId = sessionId;
                        let steamLogin = data.authenticateuser.token
                        let steamLoginSecure = data.authenticateuser.tokensecure
                        let cookie = `sessionid=${sessionId}; steamLogin=${steamLogin}; steamLoginSecure=${steamLoginSecure};`
                        return resolve(cookie);
                    }
                } catch (error) {
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }

            })();
        })
    }
    
    /**
     * Get card farming data 
     * @returns Promise with array containing items { title, appId, playTime, cardsRemaining }
     */
    async GetFarmingData() {
        if (!this.webCookie) {
            return Promise.reject()
        }

        if (!this.loggedIn) {
            return Promise.reject()
        }

        let self = this;
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "User-Agent": "Valve/Steam HTTP Client 1.0",
                        "Cookie": self.webCookie
                    }
                }

                try {
                    let data = await Request(options)
                    return resolve(self.ParseFarmingData(data));
                } catch (error) {
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }

    /**
     * Helper function for GetFarmingData()
     * @param {*} data raw html card farming data
     * @returns array containing items { title, appId, playTime, cardsRemaining }
     */
    ParseFarmingData(data) {
        const $ = cheerio.load(data, { decodeEntities: false });

        let farmingData = [];

        $(".badge_row").each(function () {
            // check for remaining cards
            let progress = $(this).find(".progress_info_bold").text();
            if (!progress) {
                return;
            }

            progress = Number(progress.replace(/[^0-9\.]+/g, ""));
            if (progress === 0) {
                return;
            }

            // Get play time
            let playTime = $(this).find(".badge_title_stats_playtime").text();
            if (!playTime) {
                return;
            }
            playTime = Number(playTime.replace(/[^0-9\.]+/g, ""));


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
            let appId = Number(link.replace(/[^0-9\.]+/g, ""));

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

    /**
     * Get Inventory data
     * @returns Promise with array inventory data
     */
    async GetIventory() {
        if (!this.webCookie) {
            return Promise.reject()
        }

        if (!this.loggedIn) {
            return Promise.reject()
        }

        let self = this;
        return new Promise(async (resolve, reject) => {
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
                    timeout: self.STEAMCOMMUNITY_TIMEOUT,
                    headers: {
                        "User-Agent": "Valve/Steam HTTP Client 1.0",
                        "Cookie": self.webCookie
                    }
                }

                try {
                    let inventory = await Request(options)
                    inventory = JSON.parse(inventory);
                    if (!inventory.success) {
                        setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                    }

                    if (inventory.rgDescriptions.length == 0) {
                        return resolve(null);
                    }

                    return resolve(inventory.rgDescriptions);
                } catch (error) {
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }
            })();
        })
    }


}

module.exports = Client;
"use strict";

const Steam = require('./index')
const EventEmitter = require('events').EventEmitter;
const GetProxy = require('../util/proxy').GetProxy;
const GetSteamCM = require('../util/steamcm').GetSteamCM
const RemoveProxy = require("../util/proxy").RemoveProxy 
const Crypto = require('crypto');
const SteamTotp = require('steam-totp');
const Request = require("request-promise-native")
const SocksProxyAgent = require('socks-proxy-agent');
const SteamCrypto = require("@doctormckay/steam-crypto")
const cheerio = require('cheerio')

class Client extends EventEmitter {
    constructor(account) {
        super();

        this.account = {
            user: account.user,
            pass: account.pass,
            emailGuard: account.emailGuard,
            sentry: account.sentry,
            shared_secret: account.shared_secret,
            status: account.status,
            forcedStatus: account.forcedStatus,
            skipFarmingData: account.skipFarmingData
        }

        this.STEAMCOMMUNITY_TIMEOUT = 2000
        this.STEAMCOMMUNITY_RETRY_DELAY = 1000
        this.CONNECTION_TIMEOUT = 5 // in seconds
        this.CONNECT_DELAY = 150 // maximum delay in seconds


        let self = this;
        let timeout = Math.floor(Math.random() * this.CONNECT_DELAY)
        setTimeout(() => self.connect(), timeout * 1000);
    }

    /************************************************************************
    *  					       PLAY GAMES			                        *
    * 	"activated-apps" event will be emitted along with:                  *
    *    on success: Array of objects {appid, name, logo}                   *                                          *
    *    on fail: does not fail                                             *
    ************************************************************************/
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

    /************************************************************************
    *  					    ACTIVATE FREE GAME			                    *
    * 	"activated-apps" event will be emitted along with:                  *
    *    on success: Array of objects {appid, name, logo}                   *                                          *
    *    on fail: "Could not activate this game."                           *
    ************************************************************************/
    activateFreeGame(appIds) {
        if (!this.loggedIn) {
            return;
        }

        let self = this;
        return new Promise((resolve, reject) => {
            // register the event first
            self.client.once('activated-apps', games => {
                if (!games) {
                    reject("Could not activate this game.")
                } else {
                    resolve(games)
                }
            })
            self.client.activateFreeGame(appIds)
        })
    }

    /************************************************************************
    *  					       REDEEM CDKEY			                        *
    * 	"redeem-key" event will be emitted along with:                      *
	*    on success: Array of objects {appid, name, logo}                   *                                          *
	*    on fail: String with error message                                 *
    ************************************************************************/
    redeemKey(cdkey) {
        if (!this.loggedIn) {
            return;
        }
        let self = this;
        return new Promise((resolve, reject) => {
            // register the event first
            self.client.once('redeem-key', games => {
                if (Array.isArray(games)) {
                    resolve(games)
                } else {
                    reject(games)
                }
            })
            self.client.redeemKey(cdkey)
        })
    }

    /************************************************************************
    *  				  SET PERSONA state, name(optional)			            *
    * 	"Offline": 0,                                                       *
	*   "Online": 1,                                                        *
	*   "Busy": 2,                                                          *
	*   "Away": 3,                                                          *
	*   "Snooze": 4,                                                        *
	*   "LookingToTrade": 5,                                                *
	*   "LookingToPlay": 6,                                                 *
	*   "Invisible": 7                                                      *
    ************************************************************************/
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

    /************************************************************************
    *  					    Generate web cookie            			        * 
    ************************************************************************/
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
                    console.log(`GenerateWebCookie too many tries > user: ${self.account.user}`)
                    return reject();
                }

                let sessionKey = SteamCrypto.generateSessionKey();
                let encryptedNonce = SteamCrypto.symmetricEncryptWithHmacIv(nonce, sessionKey.plain);

                let data = {
                    steamid: self.steamid,
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
                        console.log(`GenerateWebCookie bad cookie > user: ${self.account.user}`)
                        setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                    } else {
                        let sessionId = Crypto.randomBytes(12).toString('hex')
                        let steamLogin = data.authenticateuser.token
                        let steamLoginSecure = data.authenticateuser.tokensecure
                        self.webCookie = `sessionid=${sessionId}; steamLogin=${steamLogin}; steamLoginSecure=${steamLoginSecure};`
                        return resolve();
                    }
                } catch (error) {
                    setTimeout(() => attempt(retries), self.STEAMCOMMUNITY_RETRY_DELAY);
                }

            })();
        })
    }

    /************************************************************************
    *  					    Get farming data                                *
    * returns array of objs   { title, appId, playTime, cardsRemaining }    * 
    ************************************************************************/
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
                    console.log(`GetCardsData too many tries > user: ${self.account.user}`)
                    return reject();
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let options = {
                    url: `https://steamcommunity.com/profiles/${self.steamid}/badges`,
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


    /************************************************************************
    *  				Get account's steam inventory                           *
    * returns obj                                                           * 
    ************************************************************************/
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
                    console.log(`GetIventory too many tries > user: ${self.account.user}`)
                    return reject();
                }

                let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
                let agent = new SocksProxyAgent(proxy);

                let options = {
                    url: `https://steamcommunity.com/profiles/${self.steamid}/inventory/json/753/6`,
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
                        console.log(`GetIventory bad data > user: ${self.account.user}`)
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

    /************************************************************************
     * 					        LOGIN TO STEAM					            *
     ************************************************************************/
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

                self.steamid = res.client_supplied_steamid

                let loginResp = {
                    steamid: self.steamid
                };

                // generate web cookie
                try {
                    await self.GenerateWebCookie(res.webapi_authenticate_user_nonce);
                } catch (error) {
                    // could not generate web cookie, account will relogin.
                    self.RenewConnection()
                    return;
                }

                // skip farming data if specified
                if (!self.account.skipFarmingData) {
                    try {
                        loginResp.farmingData = await self.GetFarmingData();
                        // do not fetch data again.
                        self.account.skipFarmingData = true;
                    } catch (error) {
                        // could not get farming data, account will relogin.
                        self.RenewConnection()
                        return;
                    }
                }

                // Get inventory 
                try {
                    loginResp.inventory = await self.GetIventory();
                } catch (error) {
                    self.RenewConnection()
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
                self.emit("login-res", loginResp)
                return;
            }

            else if (code == 5) {
                errMsg = "Bad User/Pass"
            }

            // EMAIL GUARD 
            else if (code == 63) {
                errMsg = "Email guard code needed"
            }

            // InvalidLoginAuthCode
            else if (code == 65) {
                errMsg = "Invalid guard code"
            }

            // RATE LIMIT
            else if (code == 84) {
                self.RenewConnection()
                return;
            }

            // 2FA
            else if (code == 85) {
                errMsg = "2FA code needed"
            }

            else if (code == 88) {
                errMsg = "Invalid shared secret"
            }
            // Some other error code
            else {
                console.log(`Login failed code: ${code} > user: ${self.account.user}`)
                self.RenewConnection()
                return;
            }

            self.loggedIn = false;
            console.log(`${errMsg} > user: ${self.account.user}`)
            self.emit("loginError", errMsg);
            self.Disconnect();
        });

        this.client.once('games', games => {
            self.emit("games", games);
        })

        this.client.once("persona-name", persona_name => {
            self.emit("persona-name", persona_name)
        })

        this.client.once("avatar", avatar => {
            self.emit("avatar", avatar)
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

            self.emit("sentry", sentry);
        });

        // Login to steam
        this.client.LogOn(loginOption);
    }

    /************************************************************************
     * 					  ESTABLISH CONNECTION WITH STEAM					*
     ************************************************************************/
    async connect() {
        let self = this;

        // Get a SteamCM
        let steamcm = await GetSteamCM();
        this.proxy = await GetProxy();

        // connection options
        this.options = {
            timeout: this.CONNECTION_TIMEOUT * 1000, //timeout for lost connection, bad proxy
            proxy: {
                ipaddress: this.proxy.ip,
                port: this.proxy.port,
                type: 4
            },
            destination: {
                host: steamcm.ip,
                port: steamcm.port
            }
        }

        // Create the steam client, and connect to steam
        this.client = new Steam(self.options);

        // SUCCESSFUL CONNECTION
        self.client.once('connected', () => {
            self.login();
        })

        // CONNECTION LOST
        self.client.once('error', err => {
            // notify connection has been lost
            if (self.loggedIn) {
                self.reconnecting = true;
                self.emit("connection-lost");
            }

            console.log(`Reconnecting: ${err} > user: ${self.account.user}`)
            self.RenewConnection();
        })

    }

    // Reconnect due to bad proxy.
    RenewConnection() {
        this.Disconnect();
        // Remove the proxy
        RemoveProxy(this.proxy);
        // Reconnect
        let self = this;
        let timeout = Math.floor(Math.random() * this.CONNECT_DELAY)
        setTimeout(() => self.connect(), timeout * 1000);
    }

    Disconnect() {
        this.loggedIn = false;
        this.webCookie = false;
        this.client.removeAllListeners();
        this.client.Disconnect();
    }
}

module.exports = Client;
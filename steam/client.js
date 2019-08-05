"use strict";

const Steam = require('./index')
const EventEmitter = require('events').EventEmitter;
const GetProxy = require('../util/proxy').GetProxy;
const GetSteamCM = require('../util/steamcm').GetSteamCM
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
            gamesPlaying: account.gamesPlaying,
            skipFarmingInfo: account.skipFarmingInfo
        }

        this.loggedIn = false;
        this.connect();
    }

    /************************************************************************
    *  					       PLAY GAMES			                        *
    * 	"activated-apps" event will be emitted along with:                  *
    *    on success: Array of objects {appid, name, logo}                   *                                          *
    *    on fail: does not fail                                             *
    ************************************************************************/
    playGames(games) {
        this.account.gamesPlaying = games;
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

    async GenerateWebCookie(nonce, steamid, retries) {
        let self = this;
        return new Promise(async (resolve, reject) => {

            if (!retries) {
                retries = 0;
            }

            retries++;

            // too many tries, get a new proxy
            if (retries == 4) {
                console.log(`GenerateWebCookie too many tries > user: ${self.account.user}`)
                self.RenewConnection()
            }

            if (!self.loggedIn) {
                return resolve(null);
            }

            let sessionKey = SteamCrypto.generateSessionKey();
            let encryptedNonce = SteamCrypto.symmetricEncryptWithHmacIv(nonce, sessionKey.plain);

            let data = {
                steamid: steamid,
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
                timeout: 3500
            }

            try {
                let data = await Request(options);
                // will this happen???
                if (!data.authenticateuser) {
                    console.log(data)
                }
                let sessionId = Crypto.randomBytes(12).toString('hex')
                let steamLogin = data.authenticateuser.token
                let steamLoginSecure = data.authenticateuser.tokensecure
                let cookie = `sessionid=${sessionId}; steamLogin=${steamLogin}; steamLoginSecure=${steamLoginSecure};`
                return resolve(cookie);
            } catch (error) {
                console.log(`GenerateWebCookie retry ${retries} > user: ${self.account.user}`)

                setTimeout(async () => {
                    let cookie = await self.GenerateWebCookie(nonce, steamid, retries)
                    return resolve(cookie)
                }, 2000);
            }
        })
    }

    async GetCardsData(cookie, steamid, retries) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            if (!retries) {
                retries = 0;
            }

            retries++;

            // too many tries, get a new proxy
            if (retries == 4) {
                console.log(`GetCardsData too many tries > user: ${self.account.user}`)
                self.RenewConnection()
            }

            if (!self.loggedIn) {
                return resolve(null);
            }

            let proxy = `socks4://${self.proxy.ip}:${self.proxy.port}`
            let agent = new SocksProxyAgent(proxy);

            let options = {
                url: `https://steamcommunity.com/profiles/${steamid}/badges`,
                method: 'GET',
                agent: agent,
                timeout: 3500,
                headers: {
                    "User-Agent": "Valve/Steam HTTP Client 1.0",
                    "Cookie": cookie
                }
            }

            try {
                let data = await Request(options)
                return resolve(data);
            } catch (error) {
                console.log(`GetCardsData retry ${retries} > user: ${self.account.user}`)
                setTimeout(async () => {
                    let data = await self.GetCardsData(cookie, steamid, retries);
                    return resolve(data)
                }, 2000);
            }
        })
    }

    GetGameFarmingInfo(data) {
        const $ = cheerio.load(data);

        let games = [];

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
                gameTitle: gameTitle,
                appId, appId,
                playTime: playTime,
                cardsRemaining: progress
            }

            games.push(obj)
        })
        return games;
    }

    /************************************************************************
     * 					        LOGIN TO STEAM					            *
     ************************************************************************/
    login() {
        let self = this;

        // Setup login options
        this.loginOption = {
            account_name: this.account.user,
            password: this.account.pass,
            supports_rate_limit_response: true,
        }

        // Login with sentry file
        if (this.account.sentry) {
            this.loginOption.sha_sentryfile = this.account.sentry
        }

        // Email code
        if (this.account.emailGuard) {
            this.loginOption.auth_code = this.account.emailGuard;
        }

        //Generate mobile code if needed
        if (this.account.shared_secret) {
            this.loginOption.two_factor_code = SteamTotp.generateAuthCode(this.account.shared_secret);
        }

        // login response
        this.client.once('logOnResponse', async (res) => {
            //delete login options
            self.loginOption = {};

            // LOGGED IN
            if (res.eresult == 1) {
                self.loggedIn = true;

                let loginResp = {
                    steamid: res.client_supplied_steamid
                };

                // Generate web cookie
                let nonce = res.webapi_authenticate_user_nonce

                let webCookie = await self.GenerateWebCookie(nonce, loginResp.steamid);
                if (!webCookie) {
                    return;
                }

                // should farming info be skip
                if (!self.account.skipFarmingInfo) {
                    let data = await self.GetCardsData(webCookie, loginResp.steamid);
                    if (!data) {
                        return;
                    }

                    loginResp.farmingInfo = self.GetGameFarmingInfo(data)
                }


                console.log(`Steam Login > user: ${self.account.user}`)
                self.emit("login-res", loginResp)

                // reloggedin after connection lost
                if (self.reconnecting) {
                    self.reconnecting = false;
                    self.emit("connection-gained");
                }

                // set accounts to play games
                if (self.account.gamesPlaying && self.account.gamesPlaying.length > 0) {
                    self.playGames(self.account.gamesPlaying)
                }

                // Set persona
                if (!self.account.forcedStatus) {
                    self.account.forcedStatus = "Online"
                }

                self.setPersona(self.account.forcedStatus)

                return;
            }
            // EMAIL GUARD
            else if (res.eresult == 63) {
                res = "Email guard code needed"
            }
            // RATE LIMIT
            else if (res.eresult == 84) {
                self.loggedIn = false;
                //console.log(`Rate limit > user: ${self.account.user}`)
                self.Disconnect();
                self.connect();
                return;
            }
            // 2FA
            else if (res.eresult == 85) {
                res = "2FA code needed"
            }
            // InvalidLoginAuthCode
            else if (res.eresult == 65) {
                res = "Invalid guard code"
            }
            else if (res.eresult == 88) {
                res = "Invalid shared secret"
            }
            // INVALID USER/PASS
            else {
                res = "Bad User/Pass"
            }

            self.loggedIn = false;
            console.log(`${res} > user: ${self.account.user}`)
            self.emit("loginError", res);
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

        /*this.client.once("loginKey", loginKey => {
            self.emit("loginKey", loginKey)
        })*/

        // Login to steam
        this.client.LogOn(this.loginOption);
    }

    /************************************************************************
     * 					  ESTABLISH CONNECTION WITH STEAM					*
     ************************************************************************/
    async connect() {
        let self = this;

        // Get a SteamCM
        let steamcm = await GetSteamCM();
        let proxy = await GetProxy();

        // connection options
        this.options = {
            timeout: 10000, //timeout for lost connection, bad proxy
            proxy: {
                ipaddress: proxy.ip,
                port: proxy.port,
                type: 4
            },
            destination: {
                host: steamcm.ip,
                port: steamcm.port
            }
        }

        // Create steam client
        self.client = new Steam(self.options);

        // Connection lost
        self.client.once('error', err => {
            // emit this event to update as offline.
            if (self.loggedIn) {
                self.reconnecting = true;
                self.emit("connection-lost");
            }

            self.loggedIn = false;
            console.log(`${err} > user: ${self.account.user}`)
            self.connect(); //reconnect
        })

        // connection successful 
        self.client.once('connected', () => {
            self.proxy = proxy;
            self.login();
        })
    }

    /************************************************************************
    * 					      DISCONNECT FROM STEAM					        *
    ************************************************************************/
    Disconnect() {
        this.loggedIn = false;
        //console.log(`Disconnect > user: ${this.account.user}`)
        this.client.Disconnect();
    }


    RenewConnection() {
        this.Disconnect();
        this.connect();
    }
}

module.exports = Client;
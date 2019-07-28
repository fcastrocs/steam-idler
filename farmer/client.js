const Steam = require('./steam')
const EventEmitter = require('events').EventEmitter;
const GetProxy = require('../util/proxy').GetProxy;
const GetSteamCM = require('../util/steamcm').GetSteamCM
const crypto = require('crypto');
const SteamTotp = require('steam-totp');


class Client extends EventEmitter {
    constructor(account) {
        super();
        this.account = account;
        this.connect();
    }

    // set account to play games
    playGames(games) {
        this.account.gamesPlaying = games;
        this.client.playGames(games);
    }

    // Set persona state and name(optional)
    setPersona(state, name) {
        this.client.setPersona(state, name)
    }

    // Login to steam
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
        if(this.account.shared_secret){
            this.loginOption.two_factor_code = SteamTotp.generateAuthCode(this.account.shared_secret);
        }

        // Login to steam
        this.client.LogOn(this.loginOption);

        // login response
        this.client.once('logOnResponse', res => {
            console.log(res.eresult)
            // LOGGED IN
            if (res.eresult == 1) {
                this.emit("loggedIn", res);

                //delete login options
                this.loginOption = {};

                // set online status
                this.setPersona(1);

                // set accounts to play games
                if (this.account.gamesPlaying && this.account.gamesPlaying.length > 0) {
                    this.playGames(this.account.gamesPlaying)
                }
                return;
            }
            // EMAIL GUARD
            else if (res.eresult == 63) {
                res = "Email guard code needed"
            }
            // RATE LIMIT
            else if (res.eresult == 84) {
                this.Disconnect();
                self.connect();
                return;
            }
            // 2FA
            else if (res.eresult == 85) {
                res = "2FA code needed"
            }
            //InvalidLoginAuthCode
            else if (res.eresult == 65) {
                res = "Invalid guard code"
            }
            else if(res.eresult == 88){
                res = "Invalid shared secret"
            }
            // INVALID USER/PASS
            else {
                res = "Bad User/Pass"
            }
            console.log(res)
            this.emit("loginError", res);
        });

        this.client.once('updateMachineAuth', (sentry, callback) => {
            //get SHA1
            let shasum = crypto.createHash('sha1');
            shasum.end(sentry.bytes);
            sentry = shasum.read();

            //accept sentry
            callback({ sha_file: sentry });

            //store sentry for relogins
            this.account.sentry = sentry;

            self.emit("sentry", sentry);
        });

        this.client.once('games', games => {
            self.emit("games", games);
        })

        this.client.once("persona", persona_name => {
            self.emit("persona", persona_name)
        })

        this.client.once("avatar", avatar => {
            self.emit("avatar", avatar)
        })

        this.client.once("loginKey", loginKey => {
            self.emit("loginKey", loginKey)
        })
    }

    Disconnect() {
        this.removeAllListeners();
        this.client.Disconnect();
    }

    // Connect to steam, takes in the number of tries before giving up
    // Returns true if connection successful, false otherwise
    async connect() {
        let self = this;

        // Get a SteamCM
        await self.getSteamCM();
        await self.getProxy();

        // connection options
        this.options = {
            timeout: 10000, //timeout for lost connection, bad proxy
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

        // Create steam client
        self.client = new Steam(self.options);

        // Connection lost
        self.client.once('error', err => {
            console.log(err)
            self.connect(); //reconnect
        })

        // connection successful 
        self.client.once('connected', () => {
            self.login();
        })
    }

    async getProxy() {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            // Get a proxy
            GetProxy(proxy => {
                self.proxy = proxy;
                resolve(proxy);
            });
        });
        await promise;
    }

    async getSteamCM() {
        let self = this;
        let promise = new Promise((resolve, reject) => {
            // Get a SteamCM
            GetSteamCM(steamcm => {
                self.steamcm = steamcm;
                resolve(steamcm);
            })
        });
        await promise;
    }
}

module.exports = Client;
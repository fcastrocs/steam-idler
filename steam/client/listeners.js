const Crypto = require('crypto');
const io = require("../../app").io;

/* eslint-disable require-atomic-updates */
module.exports.loginListener = function () {
    let self = this;
    // LOGIN RESPONSE
    this.client.once('logOnResponse', async (res) => {
        let code = res.eresult
        let errMsg = ""

        // SUCCESSFUL LOGIN
        if (code == 1) {
            self.loggedIn = true;
            self.account.steamid = res.client_supplied_steamid;

            // Generate web cookie
            try {
                self.webCookie = await self.GenerateWebCookie(res.webapi_authenticate_user_nonce);
                if (this.socketId) {
                    io.to(`${this.socketId}`).emit("login-log-msg", "Received web cookie.");
                }
            } catch (error) {
                self.RenewConnection("cookie")
                return;
            }

            // To speed connection process, don't fetch farmingData and inventory again after reconnecting
            if (!this.loggedInOnce) {
                // Get farming data
                try {
                    var farmingData = await self.GetFarmingData();
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Received Steam cards data.");
                    }
                } catch (error) {
                    self.RenewConnection("farming data")
                    return;
                }


                // Get inventory
                try {
                    var inventory = await self.getInventory("let fail");
                    if (this.socketId) {
                        io.to(`${this.socketId}`).emit("login-log-msg", "Received inventory data.");
                    }
                } catch (error) {
                    self.RenewConnection("intentory")
                    return;
                }
            }

            // Set persona
            if (!self.account.forcedStatus) {
                self.account.forcedStatus = "Online"
            }
            self.setPersona(self.account.forcedStatus)

            console.log(`${this.account.user} > logged in | proxy IP: ${this.proxy.ip}`);

            // Reset flags
            this.fullyLoggedIn = true;
            this.loggedInOnce = true;

            self.emit("login-res", {
                steamid: self.account.steamid,
                farmingData: farmingData,
                inventory: inventory
            })

            if (this.socketId) {
                io.to(`${this.socketId}`).emit("login-log-msg", "Successful login.");
            }

            // After login, don't send more messages
            this.socketId = null;

            if (!self.account.newAccount && self.wasLoggedIn) {
                self.emit("connection-gained");
            }

            // not a new account anymore, this will cause for code 88 retries
            self.account.newAccount = false;
            return
        }
        else if (code == 5) {
            errMsg = "Bad User/Pass."
        }
        else if (code == 56) { //"PasswordUnset"
            errMsg = "Check your login details."
        }
        // EMAIL GUARD 
        else if (code == 63 || code == 65) {
            this.waitEmailGuard = true;

            if (this.socketId) {
                if (code == 63) {
                    io.to(`${this.socketId}`).emit("add-acc-error-msg", "Email guard code needed.");
                }
                else {
                    io.to(`${this.socketId}`).emit("add-acc-error-msg", "Invalid email guard code.");
                }

                io.sockets.sockets[this.socketId].once("email-guard", code => {
                    io.to(`${this.socketId}`).emit("login-log-msg", "Email guard code received, retrying.");
                    this.waitEmailGuard = false;
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
            // this is necessary because sometimes the shared secret fails
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

            console.error(`Login failed code: ${code} > user: ${self.account.user}`)
            self.RenewConnection(`code ${code}`)
            return;
        }

        if (this.socketId) {
            io.to(`${this.socketId}`).emit("login-log-msg", errMsg);
        }

        console.log(`${errMsg} > user: ${self.account.user}`)
        self.emit("loginError", errMsg);
        self.Disconnect();
    });


}

module.exports.afterLoginListeners = function () {
    let self = this;

    // received games listener
    this.client.once('games', games => {
        self.emit("games", games);

        if (this.socketId) {
            io.to(`${this.socketId}`).emit("login-log-msg", "Received games.");
        }
    })

    // received persona-name listener
    this.client.once("persona-name", persona_name => {
        self.emit("persona-name", persona_name)

        if (this.socketId) {
            io.to(`${this.socketId}`).emit("login-log-msg", "Received persona name.");
        }
    })

    // received avatar listener
    this.client.once("avatar", avatar => {
        self.emit("avatar", avatar)

        if (this.socketId) {
            io.to(`${this.socketId}`).emit("login-log-msg", "Received avatar.");
        }
    })

    // received sentry listener
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
}

module.exports.connectionListeners = function () {
    let self = this;
    // SUCCESSFUL CONNECTION
    this.client.once('connected', () => {
        if (this.socketId && !this.loginMessageSent) {
            // don't send more "successful connection" messages after the first one
            this.loginMessageSent = true;
            io.to(`${this.socketId}`).emit("login-log-msg", "Connected to Steam, attemping login.");
        }
        self.login();
    })

    // CONNECTION LOST
    this.client.once('error', err => {
        // notify connection has been lost
        if (self.loggedIn) {
            // this flag is only used to know when to send "connection-ganed"
            self.wasLoggedIn = true;
            self.loggedIn = false;
            if (!self.account.newAccount) {
                self.emit("connection-lost");
            }
        }

        // wait for email guard, don't reconnect;
        if (this.waitEmailGuard) {
            return;
        }

        self.RenewConnection(err);
    })
}
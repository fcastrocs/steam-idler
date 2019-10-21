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
            self.loggedIn = false;
            self.emit("connection-lost");
        }

        // wait for email guard, don't reconnect;
        if (this.dontReconnect) {
            return;
        }

        self.RenewConnection(err);
    })
}
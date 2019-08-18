/************************************************************************
* 					          STEAM FUNCTIONS					        *
************************************************************************/
const Client = require('../steam/client');
const Security = require("../util/security");
const SteamAccount = require('../models/steam-accounts')
const mongoose = require('mongoose');

/**
 * Login to steam
 * Returns promise with account
 */
module.exports.addAccount = async function (userId, loginOptions) {
    let self = this;
    return new Promise(async function (resolve, reject) {
        // Find account in DB
        let doc = await self.getAccount({ user: loginOptions.user });
        if (doc) {
            return reject("Account already in DB.");
        }

        try {
            let doc = await self.loginAccount(userId, null, {
                dontGetAccount: true,
                skipOnlineCheck: true,
                skipLoginOptions: true,
                loginOptions: loginOptions,
                noLoginDelay: true,
                skipIdlingFarmingRestart: true,
                noDelay: true // set no delay for account login
            })
            return resolve(doc);
        } catch (error) {
            return reject(error)
        }
    })
}

/**
 * Logins account to steam
 * Restarts idling/farming process
 * Returns a promise with account
 */
module.exports.loginAccount = async function (userId, accountId, options) {
    let self = this;
    return new Promise(async function (resolve, reject) {

        // account doc passed
        if (options && options.account) {
            var doc = options.account
        }

        // don't fetch account document
        if (!options || !options.dontGetAccount) {
            var doc = await self.getAccount({ userId: userId, accountId: accountId })
            // account not found
            if (!doc) {
                return reject("Account not found.")
            }
        }

        // don't check online status
        if (!options || !options.skipOnlineCheck) {
            let client = self.isAccountOnline(userId, accountId);
            if (client) {
                return reject("Account is already online.");
            }
        }

        try {
            // don't setup login options
            if (!options || !options.skipLoginOptions) {
                var loginOptions = self.setupLoginOptions(doc);
            }

            // login options passed
            if (options && options.loginOptions) {
                var loginOptions = options.loginOptions
            }

            // Set no login delay
            if (options && options.noLoginDelay) {
                loginOptions.noLoginDelay = true;
            }

            // login, loginOptions gets modified
            let client = await self.steamConnect(loginOptions);

            // new account, request came from addAccount
            if (options && options.newAccount) {
                // create new doc
                var doc = new SteamAccount({
                    _id: mongoose.Types.ObjectId(), // need an object Id before saving
                    userId: userId,
                    user: loginOptions.user,
                    pass: Security.encrypt(loginOptions.pass),
                    forcedStatus: "Online",
                    farmingData: loginOptions.farmingData,
                    inventory: loginOptions.inventory,
                    steamid: loginOptions.steamid
                })

                // Only 2FA accs get shared secret
                if (loginOptions.shared_secret) {
                    doc.shared_secret = Security.encrypt(loginOptions.shared_secret);
                }
                // 2FA accs don't get sentry
                if (loginOptions.sentry) {
                    doc.sentry = loginOptions.sentry;
                }
            }

            //update account properties after login
            doc.games = self.addGames(loginOptions.games, doc.games);
            doc.persona_name = loginOptions.persona_name;
            doc.avatar = loginOptions.avatar;
            doc.status = loginOptions.status || "Online"
            doc.inventory = loginOptions.inventory;
            doc.lastConnect = Date.now();

            // clean up
            loginOptions = null;

            self.saveToHandler(userId, doc._id, client);

            // Restart farming or idling
            if (!options || !options.skipIdlingFarmingRestart) {
                await self.farmingIdlingRestart(client, doc)
            }

            // Save account
            await self.saveAccount(doc);

            return resolve(self.filterSensitiveAcc(doc))
        } catch (error) {
            console.log(error)
            //login error
            if (!options || !options.newAccount) {
                doc.status = error;
                self.saveAccount(doc)
            }
            return reject(error);
        }
    })
}

/**
 * Logout account from steam
 */
module.exports.logoutAccount = async function (userId, accountId) {
    let self = this;
    return new Promise(async function (resolve, reject) {
        //Find account in DB
        let doc = await self.getAccount({ userId: userId, accountId: accountId })
        // account not found
        if (!doc) {
            return reject("Account not found.")
        }

        // check account is logged in
        let client = self.isAccountOnline(userId, accountId);
        if (!client) {
            //force offline status
            doc.status = "Offline";
            doc = await self.saveAccount(doc);
            doc = self.filterSensitiveAcc(doc);
            return resolve(doc)
        }

        // stop farming process
        clearInterval(client.farmingReCheckId);

        // Remove account from handler
        self.removeFromHandler(userId, accountId);

        //finally update account status to offline
        doc.status = "Offline";
        doc = await self.saveAccount(doc)
        doc = self.filterSensitiveAcc(doc);
        return resolve(doc);
    })
}


/**
 * Change accounts persona name / nick
 * Saves account changes to database
 * Returns a promise with account
 */
module.exports.changeNick = async function (userId, accountId, name) {
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.");
    }

    let account = await this.getAccount({ userId: userId, accountId: accountId })
    if (!account) {
        return Promise.reject("Account not found.")
    }

    client.setPersona(account.forcedStatus, name);
    account.persona_name = name;
    await this.saveAccount(account);
    return Promise.resolve(name);
}

/**
 * Starts idling games
 * Saves account changes to database
 * Returns a promise with account
 */
module.exports.playGames = async function (userId, accountId, games) {
    let self = this;
    return new Promise(async function (resolve, reject) {

        let client = self.isAccountOnline(userId, accountId);
        if (!client) {
            return reject("Account is not online.");
        }

        //save playing games to account and force correct status
        let account = await self.getAccount({ userId: userId, accountId: accountId })
        if (!account) {
            return Promise.reject("Account not found.")
        }

        // Play games
        let status = client.playGames(games);

        account.gamesPlaying = games;
        account.status = status;
        account = await self.saveAccount(account);
        account = self.filterSensitiveAcc(account);
        resolve(account);
    })
}

/**
 * Connects to account to steam
 * Registers steam events
 * Resolves once we get needed data
 */
module.exports.steamConnect = async function (loginOptions) {
    let self = this;
    // Resolve promise once we get needed data
    return new Promise(async function (resolve, reject) {
        let event_count = 0

        // Create client
        let client = new Client(loginOptions);

        // account has logged in
        client.once('login-res', (res) => {
            loginOptions.steamid = res.steamid;
            loginOptions.farmingData = res.farmingData;
            loginOptions.inventory = res.inventory;
            
            event_count++;
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // login error has occurred
        client.once("loginError", err => {
            loginOptions.status = err;
            return reject(err)
        })

        // sentry has been accepted
        client.once("sentry", sentry => {
            loginOptions.sentry = Security.encrypt(sentry)
        })

        // games in account
        client.once("games", games => {
            event_count++;
            loginOptions.games = games
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // persona name/nick
        client.once("persona-name", persona_name => {
            event_count++
            // no name?
            if (!persona_name) {
                loginOptions.persona_name = "No Nickname?"
            } else {
                loginOptions.persona_name = persona_name
            }
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // account avatar
        client.once("avatar", avatar => {
            event_count++;
            loginOptions.avatar = avatar
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // connection has been lost after being logged in
        client.on("connection-lost", async () => {
            let doc = await self.getAccount({ user: client.account.user });
            if (!doc) {
                return;
            }

            // stop farming interval if it exists
            clearInterval(client.farmingReCheckId);
            doc.status = "Reconnecting";
            self.saveAccount(doc);
        })

        // connection has been regained after being logged in
        client.on("connection-gained", async () => {
            //find acc by user
            let doc = await self.getAccount({ user: client.account.user });
            if (!doc) {
                return;
            }

            // old last connect
            oldLastConnect = doc.lastConnect
            // update last connect time
            doc.lastConnect = Date.now();

            // Update last hour reconnects
            // find elapsed time from oldlastconnect and now
            let diff = doc.lastConnect - oldLastConnect;
            //convert to seconds
            let time = Math.abs(diff / 1000)
            let hours = Math.floor(time / 3600)

            if (hours >= 1) {
                doc.lastHourReconnects = 1
            } else {
                doc.lastHourReconnects++
            }
            // Restart farming or idling
            await self.farmingIdlingRestart(client, doc)
            // save account
            self.saveAccount(doc);
        })

    })
}


/**
 * Deletes an account
 * Returns a promise
 */
module.exports.deleteAccount = async function (userId, accountId) {
    //Find account in DB
    let doc = await this.getAccount({ userId: userId, accountId: accountId })
    // account not found
    if (!doc) {
        return Promise.reject("Account not found.")
    }

    // try to remove account from handler
    let client = this.isAccountOnline(userId, accountId);
    if (client) {
        this.removeFromHandler(userId, accountId);
    }

    // stop farming process
    clearInterval(client.farmingReCheckId);

    await doc.delete();
    return Promise.resolve();
}


/**
 * Activate free game to account
 * Returns a promise with account
 */
module.exports.activateFreeGame = async function (userId, accountId, appIds) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // find account in db
    let acc = await this.getAccount({ userId: userId, accountId: accountId });
    if (!acc) {
        return Promise.reject("Account not found.")
    }

    try {
        let games = await client.activateFreeGame(appIds)
        acc.games = this.addGames(games, acc.games);
        await this.saveAccount(acc)
        return Promise.resolve(games)
    } catch (error) {
        console.log(error)
        return Promise.reject(error)
    }
}


/**
 * Redeems a key to account
 * Returns a promise with account
 */
module.exports.redeemKey = async function (userId, accountId, cdkey) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    //find account in db
    let acc = await this.getAccount({ userId: userId, accountId: accountId });
    if (!acc) {
        return Promise.reject("Account not found.")
    }

    try {
        let games = await client.redeemKey(cdkey)
        acc.games = this.addGames(games, acc.games);
        await this.saveAccount(acc);
        return Promise.resolve(games);
    } catch (error) {
        console.log(error)
        return Promise.reject(error)
    }
}

/**
 * Sets status to account
 * Returns a promise with account
 */
module.exports.setStatus = async function (userId, accountId, status, options) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // Don't fetch account if it is passed
    if (!options || !options.account) {
        var doc = await this.getAccount({ userId: userId, accountId: accountId });
        if (!doc) {
            return Promise.reject("Account not found.")
        }
    }

    // account doc is passed
    if (options && options.account) {
        var doc = options.account;
    }

    // change account to status
    doc.forcedStatus = status;
    client.setPersona(status);

    await this.saveAccount(doc);
    this.filterSensitiveAcc(doc)
    return Promise.resolve(doc)
}
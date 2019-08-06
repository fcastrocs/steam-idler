/************************************************************************
* 					          STEAM FUNCTIONS					        *
************************************************************************/
const Client = require('../steam/client');
const Security = require("../util/security");
const SteamAccount = require('../models/steam-accounts')

module.exports.changeNick = async function (userId, accountId, name) {
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.");
    }
    client.setPersona(1, name)

    let account = await this.getAccount(userId, accountId);
    if (!account) {
        return Promise.reject("Account not found.")
    }
    account.persona_name = name;
    await this.saveAccount(account);
    return Promise.resolve(name);
}


module.exports.playGames = async function (userId, accountId, games) {
    let self = this;
    return new Promise(async function (resolve, reject) {

        let client = self.isAccountOnline(userId, accountId);
        if (!client) {
            return reject("Account is not online.");
        }

        // Play games
        let status = client.playGames(games)

        //save playing games to account and force correct status
        let account = await self.getAccount(userId, accountId);
        account.gamesPlaying = games;
        account.status = status;
        await self.saveAccount(account);
        resolve(account.status);
    })
}

// connect to steam and register events
module.exports.steamConnect = async function (account) {
    let self = this;
    // Resolve promise once we get needed data
    return new Promise(async function (resolve, reject) {
        let event_count = 0

        // Create client
        let client = new Client(account);

        // Register needed events

        // account has logged in
        client.once('login-res', res => {
            event_count++;
            account.steamid = res.steamid;
            account.farmingData = res.farmingData;
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // login error has occurred
        client.once("loginError", err => {
            account.status = err;
            return reject(err)
        })

        // sentry has been accepted
        client.once("sentry", sentry => {
            account.sentry = Security.encrypt(sentry)
        })

        // games in account
        client.once("games", games => {
            event_count++;
            account.games = games
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // persona name/nick
        client.once("persona-name", persona_name => {
            event_count++
            // no name?
            if (!persona_name) {
                account.persona_name = "No Nickname?"
            } else {
                account.persona_name = persona_name
            }
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // account avatar
        client.once("avatar", avatar => {
            event_count++;
            account.avatar = avatar
            if (event_count === 4) {
                return resolve(client);
            }
        })

        // connection has been lost after being logged in
        client.on("connection-lost", async () => {
            let doc = await self.getAccount(null, null, account.user);
            if (!doc) {
                return;
            }
            // stop farming interval if it exists
            clearInterval(client.farmingReCheckId);
            doc.status = "Reconnecting";
            await self.saveAccount(doc);
        })

        // connection has been regained after being logged in
        client.on("connection-gained", async () => {
            //find acc by user
            let doc = await self.getAccount(null, null, account.user);
            if (!doc) {
                return;
            }

            // Restart farming or idling
            self.farmingIdlingRestart(client, doc)
        })

        // client.once("loginKey", loginKey => {
        //     account.loginKey = loginKey
        // })
    })
}

module.exports.loginAccount = async function (userId, accountId) {
    let self = this;
    return new Promise(async function (resolve, reject) {

        let doc = await self.getAccount(userId, accountId)
        // account not found
        if (!doc) {
            return reject("Account not found.")
        }

        let client = self.isAccountOnline(userId, accountId);
        if (client) {
            return reject("Account is already online.");
        }

        try {
            let options = self.setupLoginOptions(doc);
            let client = await self.steamConnect(options);
            self.saveToHandler(userId, accountId, client);

            //update account properties after login
            doc.games = self.addGames(options.games, doc.games);
            doc.persona_name = options.persona_name;
            doc.avatar = options.avatar;
            doc.status = options.status;

            // Restart farming or idling
            self.farmingIdlingRestart(client, doc)

            return resolve(doc.forcedStatus)
        } catch (error) {
            //login error
            doc.status = error;
            self.saveAccount(doc)
            return reject(error);
        }
    })
}



module.exports.deleteAccount = async function (userId, accountId) {
    //Find account in DB
    let doc = await this.getAccount(userId, accountId)
    // account not found
    if (!doc) {
        return Promise.reject("Account not found.")
    }
    // check account if account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (client) {
        this.removeFromHandler(userId, accountId);
    }

    await doc.delete();
    return Promise.resolve("deleted");
}


module.exports.logoutAccount = async function (userId, accountId) {
    let self = this;
    return new Promise(async function (resolve, reject) {
        //Find account in DB
        let doc = await self.getAccount(userId, accountId)
        // account not found
        if (!doc) {
            return reject("Account not found.")
        }

        // check account is logged in
        let client = self.isAccountOnline(userId, accountId);
        if (!client) {
            //force offline status
            doc.status = "Offline";
            await self.saveAccount(doc);
            return resolve("Offline")
        }

        // Remove handler
        await self.removeFromHandler(userId, accountId);

        //finally update account status to offline
        doc.status = "Offline";
        await self.saveAccount(doc)
        return resolve("Offline");
    })
}


module.exports.addAccount = async function (userId, account) {
    let self = this;
    return new Promise(async function (resolve, reject) {
        //Find account in DB
        let doc = await self.getAccount(userId, null, account.user);
        if (doc) {
            return reject("Account already in DB.");
        }

        //try to login to steam
        try {
            let client = await self.steamConnect(account);

            //save account to database
            let steamacc = new SteamAccount({
                userId: userId,
                user: account.user,
                pass: Security.encrypt(account.pass),
                status: "Online",
                forcedStatus: "Online",
                games: account.games,
                steamid: account.steamid,
                persona_name: account.persona_name,
                avatar: account.avatar,
                farmingData: account.farmingData
            })

            // Only 2FA accs get shared secret
            if (account.shared_secret) {
                steamacc.shared_secret = Security.encrypt(account.shared_secret);
            }
            // 2FA accs don't get sentry
            if (account.sentry) {
                steamacc.sentry = account.sentry;
            }

            // Save to database
            doc = await self.saveAccount(steamacc)

            //save and store account to handler
            self.saveToHandler(userId, doc._id, client);
            return resolve(doc)
        } catch (error) {
            return reject(error);
        }
    })
}


module.exports.activateFreeGame = async function (userId, accountId, appIds) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    //find account in db
    let acc = await this.getAccount(userId, accountId, null);
    if (!acc) {
        return Promise.reject("Account not found.")
    }

    try {
        let games = await client.activateFreeGame(appIds)
        acc.games = this.addGames(games, acc.games);
        this.saveAccount(acc)
        return Promise.resolve(games)
    } catch (error) {
        console.log(error)
        return Promise.reject(error)
    }
}


module.exports.redeemKey = async function (userId, accountId, cdkey) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    //find account in db
    let acc = await this.getAccount(userId, accountId);
    if (!acc) {
        return Promise.reject("Account not found.")
    }

    try {
        let games = await client.redeemKey(cdkey)
        acc.games = this.addGames(games, acc.games);
        this.saveAccount(acc);
        return Promise.resolve(games);
    } catch (error) {
        console.log(error)
        return Promise.reject(error)
    }
}

module.exports.setStatus = async function (userId, accountId, status) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // Find account in db-
    let doc = await this.getAccount(userId, accountId, null);
    if (!doc) {
        return Promise.reject("Account not found.")
    }

    doc.forcedStatus = status;

    client.setPersona(status);
    await this.saveAccount(doc);
    return Promise.resolve(doc.forcedStatus)
}

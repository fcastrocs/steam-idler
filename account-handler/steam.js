/* eslint-disable require-atomic-updates */
/************************************************************************
* 					          STEAM FUNCTIONS					        *
************************************************************************/
const Client = require('../steam/client/');
const Security = require("../util/security");
const SteamAccount = require('../models/steam-accounts')
const mongoose = require('mongoose');
const io = require("../app").io;
const Accounts = require("../models/steam-accounts");
const User = require("../models/user");
const getSteamId = require("../steam/steamID");

/**
 * Login to steam
 * Returns promise with account
 */
module.exports.addAccount = async function (userId, options) {
    let self = this;

    let socketId = options.socketId;
    delete options.socketId;

    // Find account in DB
    let doc = await self.getAccount({ user: options.user });
    if (doc) {
        io.to(`${socketId}`).emit("add-acc-error-msg", "This account has already been added.");
        return Promise.reject("Account already in DB.");
    }

    // try login
    try {
        let loginOptions = {
            newAccount: true,
            loginOptions: options,
            socketId: socketId,
        }
        doc = await self.loginAccount(userId, null, loginOptions);
        return Promise.resolve("Account added successfully.");
    } catch (error) {
        io.to(`${socketId}`).emit("add-acc-error-msg", error);
        return Promise.reject(error)
    }
}

/**
 * Logins account to steam
 * Restarts idling/farming process
 * Returns a promise with account
 */
module.exports.loginAccount = async function (userId, accountId, options) {
    let self = this;
    let loginOptions = {}

    let newAccount = (options !== null ? options.newAccount : null);
    let doc = (options !== null ? options.account : null)

    // fetch account if not a new account or account not passed
    if (!newAccount && !doc) {
        doc = await self.getAccount({ userId: userId, accountId: accountId })
        // account not found
        if (!doc) {
            return Promise.reject("Account not found.")
        }
    }

    // check if account is online if it's a new account
    if (!newAccount) {
        // check if account is online
        if (self.isAccountOnline(userId, accountId)) {
            return Promise.reject("Account is already online.");
        }

        // also setup login options
        loginOptions = self.setupLoginOptions(doc);

    } else { // new account, login options passed
        loginOptions.newAccount = true;
        loginOptions = options.loginOptions
    }

    // request came from accounts initiolizer
    if (options && options.initializing) {
        loginOptions.initializing = true;
    }

    // setup socketId
    let socketId = null;
    if (options && options.socketId) {
        socketId = options.socketId;
    }

    try {
        // attempt login, loginOptions gets modified during the process.
        let client = await self.steamConnect(loginOptions, socketId);

        // // add games to current list if not a new account
        // if (!newAccount) {
        //     doc.games = self.addGames(loginOptions.games, doc.games);
        // }

        // PREPARE TO SAVE TO DB

        // new account
        if (newAccount) {
            // create new doc
            doc = new SteamAccount({
                _id: mongoose.Types.ObjectId(), // need an object Id before saving
                userId: userId,
                user: loginOptions.user,
                pass: Security.encrypt(loginOptions.pass),
                forcedStatus: "Online",
                farmingData: loginOptions.farmingData,
                inventory: loginOptions.inventory,
                steamid: loginOptions.steamid,
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

        doc.games = loginOptions.games;
        doc.persona_name = loginOptions.persona_name;
        doc.avatar = loginOptions.avatar;
        doc.status = loginOptions.status || "Online"
        doc.farmingData = loginOptions.farmingData;
        doc.inventory = loginOptions.inventory;
        doc.lastConnect = Date.now();

        // clean up
        loginOptions = null;

        // save accountId in the client
        client.accountId = doc._id;

        // save account to auto-restarter
        self.saveToHandler(userId, doc._id, client);

        // Check if farming should restart if not a new account
        if (!newAccount) {
            await self.farmingIdlingRestart(client, doc)
        }

        // start total hours idled increaser timer
        self.startIdledHrsTimer(client);

        // Finally save the account
        await self.saveAccount(doc);
        // filter sensetive data before responding to user request
        doc = self.filterSensitiveAcc(doc)

        if (options && options.socketId) {
            io.to(`${options.socketId}`).emit("logged-in", doc);
        }

        return Promise.resolve(doc)
    } catch (error) {
        // if error occurred, update account status with the error
        if (doc) {
            doc.status = error;
            self.saveAccount(doc)
        }
        return Promise.reject(error);
    }
}

module.exports.startIdledHrsTimer = function (client) {
    let id = setInterval(() => {
        Accounts.updateOne({ _id: client.accountId }, { $inc: { idledSeconds: 30 } }).exec();
    }, 30 * 1000);
    client.idledHrsTimerId = id;
}

module.exports.stopIdledHrsTimer = function (timerId) {
    clearInterval(timerId);
}

/**
 * Logout account from steam
 */
module.exports.logoutAccount = async function (userId, accountId) {
    let self = this;
    //Find account in DB
    let doc = await self.getAccount({ userId: userId, accountId: accountId })
    // account not found
    if (!doc) {
        return Promise.reject("Account not found.")
    }

    // check account is logged in, else force logoff
    let client = self.isAccountOnline(userId, accountId);
    if (!client) {
        //force offline status
        doc.status = "Offline";
        doc = await self.saveAccount(doc);
        doc = self.filterSensitiveAcc(doc);
        return Promise.resolve(doc)
    }

    // stop total hours idled increaser timer
    this.stopIdledHrsTimer(client.idledHrsTimerId);

    // stop farming process
    clearInterval(client.farmingReCheckId);

    // Remove account from handler
    self.removeFromHandler(userId, accountId);

    //finally update account status to offline
    doc.status = "Offline";
    doc = await self.saveAccount(doc)
    doc = self.filterSensitiveAcc(doc);
    return Promise.resolve(doc);
}

/**
 * Get account inventory
 */
module.exports.getInventory = async function (userId, accountId, socketId) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    let account = await this.getAccount({ userId: userId, accountId: accountId })
    if (!account) {
        return Promise.reject("Account not found.")
    }

    // change account to status
    let inventory = await client.getInventory("don't fail");

    // save new inventory to account
    account.inventory = inventory;
    await this.saveAccount(account);

    if (socketId) {
        io.to(`${socketId}`).emit("inventory", inventory);
    }

    return inventory;
}


/**
 * Send Trade Offer
 */
module.exports.sendOffer = async function (userId, accountId) {
    //check if user has a tradeurl
    let user = await User.findById(userId).exec();
    if (!user.tradeUrl || user.tradeUrl === "") {
        return Promise.reject("Set your trade URL in settings first.")
    }

    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    let account = await this.getAccount({ userId: userId, accountId: accountId })
    if (!account) {
        return Promise.reject("Account not found.")
    }

    //Now build de trade offer
    let offer = this.buildTradeOffer(account.inventory);

    if(!offer){
        return Promise.reject("No tradable items.")
    }

    //Parse partnerId
    let start = user.tradeUrl.indexOf("=");
    let end = user.tradeUrl.indexOf("&");
    //convert to steamid
    let partnerId = user.tradeUrl.slice(start + 1, end);
    let steamId = getSteamId(partnerId);
    //Parse Token
    start = user.tradeUrl.lastIndexOf("=");
    let token = user.tradeUrl.slice(start + 1)

    try {
        let res = await client.sendOffer(steamId, token, offer, user.tradeUrl);
        return Promise.resolve(res);
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 * Helper Function for sendOffer()
 * Builds the trade offer
 */
module.exports.buildTradeOffer = function (inventory) {

    let assets = [];

    let count = 0;

    for (const item of inventory) {
        count++

        if(count == 10){
            break;
        }

        if (item.tradable == 0) {
            continue;
        }

        let asset = {
            appid: "753",
            contextid: item.contextid,
            amount: item.amount,
            assetid: item.assetid
        }
        assets.push(asset);
    }

    // no tradable items
    if(assets.length == 0){
        return null;
    }

    let offer = {
        newversion: true,
        version: assets.length + 1,
        me: {
            assets: assets,
            currency: [],
            ready: false
        },
        them: {
            assets: [],
            currency: [],
            ready: false
        }
    }

    return offer;
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
module.exports.playGames = async function (userId, accountId, games, options) {
    let account = null;

    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.");
    }

    // Account passed
    if (options && options.account) {
        account = options.account
    } else { // fetch account
        account = await this.getAccount({ userId: userId, accountId: accountId })
        if (!account) {
            return Promise.reject("Account not found.")
        }
    }

    // Play games
    let status = client.playGames(games);

    account.gamesPlaying = games;
    account.status = status;
    await this.saveAccount(account);
    return Promise.resolve(this.filterSensitiveAcc(account));
}

/**
 * Connects to account to steam
 * Registers steam events
 * Resolves once we get needed data
 */
module.exports.steamConnect = async function (loginOptions, socketId) {
    let self = this;
    // Resolve promise once we get needed data
    return new Promise(function (resolve, reject) {
        let event_count = 0

        // Create client
        let client = new Client(loginOptions, socketId);

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
            let doc = await self.getAccount({ accountId: client.accountId });
            if (!doc) {
                return;
            }

            self.stopIdledHrsTimer(client.idledHrsTimerId);

            // stop farming interval if it exists
            clearInterval(client.farmingReCheckId);
            doc.status = "Reconnecting";
            self.saveAccount(doc);
        })

        // connection has been regained after being logged in
        client.on("connection-gained", async () => {
            if (!client.accountId) {
                console.error("client does not have accountId property.")
                return;
            }

            //find acc by user
            let doc = await self.getAccount({ accountId: client.accountId });
            if (!doc) {
                return;
            }

            // old last connect
            let oldLastConnect = doc.lastConnect
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

            self.startIdledHrsTimer(client);

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
    await this.logoutAccount(userId, accountId);
    await Accounts.deleteOne({ _id: accountId, userId: userId }).exec();
    return Promise.resolve();
}

/**
 * 2019 winter sale game nominations
 */
module.exports.nominateGames = async function (userId, accountId) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // change account to status
    await client.nominateGames();
    return Promise.resolve();
}

/**
 * 2019 winter sale game nominations
 */
module.exports.viewDiscoveryQueue = async function (userId, accountId) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // change account to status
    await client.viewDiscoveryQueue();
    return Promise.resolve();
}

// Activate f2p game
module.exports.activateF2pGames = async function (userId, accountId, appIds, options) {
    let account = null;
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // don't fetch account if passed
    if (options && options.account) {
        account = options.account
    } else {
        account = await this.getAccount({ userId: userId, accountId: accountId });
        if (!account) {
            return Promise.reject("Account not found.")
        }
    }

    try {
        let games = await client.activateF2pGames(appIds)
        account.games = this.addGames(games, account.games);
        await this.saveAccount(account)
        return Promise.resolve(games)
    } catch (error) {
        return Promise.reject(error)
    }
}

// Activate free promo game
module.exports.activateFreePromoGame = async function (userId, accountId, packageId, options) {
    let account = null;
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // don't fetch account if passed
    if (options && options.account) {
        account = options.account
    } else {
        account = await this.getAccount({ userId: userId, accountId: accountId });
        if (!account) {
            return Promise.reject("Account is not found.")
        }
    }

    try {
        let games = await client.activateFreeGame(packageId)
        account.games = this.addGames(games, account.games);
        await this.saveAccount(account)
        return Promise.resolve(games)
    } catch (error) {
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
        return Promise.reject(error)
    }
}

/**
 * Sets status to account
 * Returns a promise with account
 */
module.exports.setStatus = async function (userId, accountId, status, options) {
    let doc = null;
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    // Don't fetch account if it is passed
    if (!options || !options.account) {
        doc = await this.getAccount({ userId: userId, accountId: accountId });
        if (!doc) {
            return Promise.reject("Account not found.")
        }
    }

    // account doc is passed
    if (options && options.account) {
        doc = options.account;
    }

    // change account to status
    doc.forcedStatus = status;
    client.setPersona(status);

    await this.saveAccount(doc);
    this.filterSensitiveAcc(doc)
    return Promise.resolve(doc)
}

module.exports.changeAvatar = async function (userId, accountId, binaryImg, filename) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    let doc = await this.getAccount({ userId: userId, accountId: accountId });
    if (!doc) {
        return Promise.reject("Account not found.")
    }

    try {
        let avatar = await client.changeAvatar(binaryImg, filename);
        doc.avatar = avatar;
        await this.saveAccount(doc);
        return Promise.resolve(doc.avatar);
    } catch (error) {
        return Promise.reject(error);
    }
}

module.exports.clearAliases = async function (userId, accountId) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    try {
        await client.clearAliases();
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

module.exports.changePrivacy = async function (userId, accountId, formData) {
    // check account is logged in
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        return Promise.reject("Account is not online.")
    }

    let doc = await this.getAccount({ userId: userId, accountId: accountId });
    if (!doc) {
        return Promise.reject("Account not found.")
    }

    try {
        await client.changePrivacy(formData);
        doc.privacySettings = formData;
        await this.saveAccount(doc);
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}
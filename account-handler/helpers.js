/************************************************************************
* 					          HELPER FUNCTIONS					        *
************************************************************************/
const SteamAccount = require('../models/steam-accounts')
const Security = require("../util/security");
const SteamAccHandler = require('../models/steam-account-handler')
const {
  performance
} = require('perf_hooks');

/**
 * Returns all accounts
 * userId (optinal) 
 * options (optional) dontFilter - whether to filter sensitive info or not
 * Returns all accounts or all accounts for a user
 */
module.exports.getAllAccounts = async function (userId, options) {
    let query = {}
    if (userId) {
        // Don't filter account fields
        if (options && options.dontFilter) {
            query = SteamAccount.find({ userId: userId })
        } else { // filter accounts
            query = SteamAccount.find({ userId: userId }).select(["-pass", "-shared_secret", "-sentry", "-inventory"])
        }
    } else {
        query = SteamAccount.find({})
    }

    var t0 = performance.now();
    let accounts = await query.exec();
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");

    return accounts;
}


/**
 * Restarts farming or idling process
 * Returns a promise with account
 */
module.exports.farmingIdlingRestart = async function (client, doc) {
    // Restart farming 
    if (doc.isFarming) {
        await this.startFarming(null, null, client, doc);
    } else {
        if (doc.gamesPlaying.length > 0) {
            doc.status = client.playGames(doc.gamesPlaying)
        } else {
            doc.status = "Online"
        }
    }
    return Promise.resolve();
}

/**
 * Adds games to account
 * Returns games array
 */
module.exports.addGames = function (source, dest) {
    for (let i in source) {
        dest = this.addUniqueObj(source[i], dest)
    }
    return dest;
}

/**
 * Add unique object to array
 * Returns new array
 */
module.exports.addUniqueObj = function (obj, array) {
    //trick is to stringify objects and compare
    let objString = JSON.stringify(obj);

    // Filter obj if found
    let newArray = array.filter(item => {
        let itemString = JSON.stringify(item);
        if (itemString === objString) {
            return false;
        } else {
            return true;
        }
    })

    newArray.push(obj)
    return newArray;
}

/**
 * Remove obj from array
 * returns new array
 */
module.exports.removeObj = function (obj, array) {
    let objString = JSON.stringify(obj);
    return array.filter(item => {
        let itemString = JSON.stringify(item);
        if (itemString === objString) {
            return false;
        } else {
            return true;
        }
    })
}

/**
 * setup login options
 */
module.exports.setupLoginOptions = function (acc) {
    let options = {
        user: acc.user,
        pass: Security.decrypt(acc.pass),
        gamesPlaying: acc.gamesPlaying,
        forcedStatus: acc.forcedStatus
    }

    if (acc.sentry) {
        options.sentry = Security.decrypt_buffer(acc.sentry)
    }

    if (acc.shared_secret) {
        options.shared_secret = Security.decrypt(acc.shared_secret)
    }

    return options;
}

/**
 * Save accountId to user's handler
 */
module.exports.saveToHandler = async function (userId, accountId, client) {
    // store the client
    // check if user doesn't have a dictionary yet
    if (!this.userAccounts[userId]) {
        this.userAccounts[userId] = [];
    }
    // Store the client to the handler
    this.userAccounts[userId][accountId] = client;

    // Save to DB
    let query = SteamAccHandler.findOne({ userId: userId, accountId: accountId })
    let handler = await query.exec();

    // handler already in DB
    if (handler) {
        return;
    }

    // create a new handler
    handler = new SteamAccHandler({
        userId: userId,
        accountId: accountId
    })

    // save the handler.
    handler.save()
}

/**
 * Remove accountId from user handler
 */
module.exports.removeFromHandler = async function (userId, accountId) {
    // remove from local handler
    if (this.userAccounts[userId] && this.userAccounts[userId][accountId]) {
        this.userAccounts[userId][accountId].Disconnect();
        this.userAccounts[userId][accountId] = null;
    }

    // remove from db handler
    let handler = await SteamAccHandler.findOne({ userId: userId, accountId: accountId })
    // no handler found
    if (!handler) {
        return
    }

    handler.remove();
}

/**
 * Returns account's client if it's online
 */
module.exports.isAccountOnline = function (userId, accountId) {
    let client = this.findClient(userId, accountId);
    if (!client) {
        return false;
    }

    if (!client.loggedIn) {
        return false
    }

    return client;
}

/**
 * Returns client if accountId is in user's handler
 */
module.exports.findClient = function (userId, accountId) {
    if (!this.userAccounts[userId] || !this.userAccounts[userId][accountId]) {
        return false;
    }
    return this.userAccounts[userId][accountId]
}

/**
 * Get account from database
 */
module.exports.getAccount = async function (options) {
    let query = null;

    // Find by userId
    if (options.userId && !options.accountId && !options.user) {
        query = SteamAccount.findOne({ userId: options.userId })

        // Find by accountId
    } else if (!options.userId && options.accountId && !options.user) {
        query = SteamAccount.findById(options.accountId)
    }

    // Find by user
    else if (!options.userId && !options.accountId && options.user) {
        query = SteamAccount.findOne({ user: options.user })
    }

    // Find by userId and accountId
    else if (options.userId && options.accountId) {
        query = SteamAccount.findOne({ userId: options.userId, _id: options.accountId })
    } else {
        throw "Bad options in getAccount()";
    }

    return await query.exec();
}

/**
 * Returns all user handlers
 */
module.exports.getAllUserHandlers = async function () {
    let query = SteamAccHandler.find();
    return await query.exec();
}


/**
 * Saves account to database
 * Returns document
 */
module.exports.saveAccount = function (account) {
    return new Promise(resolve => {
        account.save((err, doc) => {
            if (err) {
                console.log(err)
            } else {
                resolve(doc)
            }
        })
    })
}

// Remove sensitive data from acc
module.exports.filterSensitiveAcc = function (account) {
    let fileredAcc = {}

    for (let key in account) {
        fileredAcc[key] = account[key];
    }

    //delete fileredAcc.user
    delete fileredAcc.pass
    delete fileredAcc.shared_secret
    delete fileredAcc.sentry

    return fileredAcc;
}
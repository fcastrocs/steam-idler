/************************************************************************
* 					          HELPER FUNCTIONS					        *
************************************************************************/
const SteamAccount = require('../models/steam-accounts')
const Security = require("../util/security");
const SteamAccHandler = require('../models/steam-account-handler')

/**
 * Restarts farming or idling process
 * Returns a promise with account
 */
module.exports.farmingIdlingRestart = async function (client, doc) {
    // Restart farming 
    if (doc.isFarming) {
        doc = await this.startFarming(null, null, client, doc);
    // Restart idling
    } else {
        if (doc.gamesPlaying.length > 0) {
            doc.status = client.playGames(doc.gamesPlaying)
        } else {
            doc.status = "Online"
        }
        doc = await this.saveAccount(doc);
    }
    return Promise.resolve(doc);
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
        sentry: Security.decrypt_buffer(acc.sentry),
        gamesPlaying: acc.gamesPlaying,
        forcedStatus: acc.forcedStatus
    }

    if (acc.shared_secret) {
        options.shared_secret = Security.decrypt(acc.shared_secret)
    }

    //set correct status
    if (acc.gamesPlaying.length == 0) {
        options.status = "Online"
    } else {
        options.status = "In-game"
    }

    //don't get farming data
    options.skipFarmingData = true;

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
    if(handler){
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
    let handler = await SteamAccHandler.findOne({ userId: userId, accountId, accountId })
    // no handler found
    if(!handler){
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
    if(options.userId && !options.accountId && !options.user){
        query = SteamAccount.findOne({userId: options.userId})
    
    // Find by accountId
    }else if(!options.userId && options.accountId && !options.user){
        query = SteamAccount.findById(options.accountId)
    }

    // Find by user
    else if(!options.userId && !options.accountId && options.user){
        query = SteamAccount.findOne({user: options.user})
    }

    // Find by userId and accountId
    else if(options.userId && options.accountId){
        query = SteamAccount.findOne({userId: options.userId, _id: options.accountId})
    }else{
        throw "Bad options in getAccount()";
    }

    return await query.exec();
}

/**
 * Returns all accounts
 * userId (optinal) 
 * Returns all accounts or all accounts for a user
 */
module.exports.getAllAccounts = async function (userId) {
    let query = {}
    if(userId){
        query = SteamAccount.find({userId: userId}).select(["-pass", "-shared_secret", "-sentry"])
    }else{
        query = SteamAccount.find({})
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
module.exports.filterSensitiveAcc = function(account){
    return saveSada = {
        _id: account._id,
        games: account.games,
        status: account.status,
        forcedStatus: account.forcedStatus,
        steamid: account.steamid,
        gamesPlaying: account.gamesPlaying,
        farmingGames: account.farmingGames,
        persona_name: account.persona_name,
        avatar: account.avatar,
        farmingData: account.farmingData,
        isFarming: account.isFarming,
        nextFarmingCheck: account.nextFarmingCheck,
        inventory: account.inventory
    }
}
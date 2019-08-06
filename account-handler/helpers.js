/************************************************************************
* 					          HELPER FUNCTIONS					        *
************************************************************************/
const SteamAccount = require('../models/steam-accounts')
const Security = require("../util/security");
const SteamAccHandler = require('../models/steamacc-handler')

// Restarts an account's idling or farming
module.exports.farmingIdlingRestart = async function (client, doc) {
    // Restart farming 
    if (doc.isFarming) {
        try {
            await this.startFarming(null, null, client, doc);
        } catch (error) {
            console.log(error);
        }
        // restart idling
    } else {
        if (doc.gamesPlaying.length > 0) {
            doc.status = client.playGames(doc.gamesPlaying)
        } else {
            doc.status = "Online"
        }
        await this.saveAccount(doc);
    }
}


// Adds games to account.game array avoiding duplicates
module.exports.addGames = function (games, accountGames) {
    // trick, convert object to string and check for equality
    for (let i in games) {
        let game = JSON.stringify(games[i])
        let found = false;

        for (let j in accountGames) {
            //convert to strong
            let accGame = JSON.stringify(accountGames[j])
            if (game === accGame) {
                found = true;
                break;
            }
        }

        // push game to accountGames if it was not found
        if (!found) {
            accountGames.push(games[i])
        }
    }
    return accountGames;
}



// Set up login options
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

// Saves account to handlers
module.exports.saveToHandler = async function (userId, accountId, client) {
    // store the client
    // check if user doesn't have a dictionary yet
    if (!this.userAccounts[userId]) {
        this.userAccounts[userId] = [];
    }
    // Store the client to the handler
    this.userAccounts[userId][accountId] = client;

    // Save to DB
    let query = SteamAccHandler.findOne({ userId: userId })
    let handler = await query.exec();

    // user already has a handler in DB
    if (handler) {
        // Trick to make sure no duplicates. Try to remove it, then insert

        // Try to remove the accountId from the handler
        handler.accountIds = handler.accountIds.filter(accId => {
            return accId.toString() !== accountId
        });

        // if it was deleted, push it again
        handler.accountIds.push(accountId)
    }
    else {
        // user doesnt have a handler yet.
        handler = new SteamAccHandler({
            userId: userId,
            accountIds: [accountId]
        })
    }
    // save the handler.
    handler.save()
}

// Remove account from local and db handler
module.exports.removeFromHandler = async function (userId, accountId) {
    // remove from local handler
    if (this.userAccounts[userId] && this.userAccounts[userId][accountId]) {
        this.userAccounts[userId][accountId].Disconnect();
        this.userAccounts[userId][accountId] = null;
    }

    // remove from db handler
    let handler = await SteamAccHandler.findOne({ userId: userId })
    if (!handler || !handler.accountIds) {
        return;
    }

    handler.accountIds = handler.accountIds.filter(accId => {
        return accId.toString() !== accountId
    });

    return await handler.save();
}

// Returns accounts client if is online
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

// Returns client from local handler
module.exports.findClient = function (userId, accountId) {
    if (!this.userAccounts[userId] || !this.userAccounts[userId][accountId]) {
        return false;
    }
    return this.userAccounts[userId][accountId]
}


// Get steam account from db
module.exports.getAccount = async function (userId, accountId, user) {
    let query = null;

    // find by userId and accountId
    if (userId && accountId) {
        query = SteamAccount.findOne({ _id: accountId, userId: userId })
    }
    // find by userId and user
    else if (userId && user) {
        query = SteamAccount.findOne({ userId: userId, user: user })
    }
    // find by user
    else if (!userId && !accountId && user) {
        query = SteamAccount.findOne({ user: user })
    }
    // find by id
    else if (!userId && accountId && !user) {
        query = SteamAccount.findById(accountId)
    } else {
        return null;
    }

    return await query.exec();
}

// Get all steam accounts
module.exports.getAllAccounts = async function () {
    let query = SteamAccount.find({})
    return await query.exec();
}

// Get all user handlers
module.exports.getAllUserHandlers = async function () {
    let query = SteamAccHandler.find();
    return await query.exec();
}



// Save steam account to database
module.exports.saveAccount = async function (account) {
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


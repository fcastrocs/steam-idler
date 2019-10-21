/************************************************************************
* 					          FARMING FUNCTIONS					        *
************************************************************************/

/**
 * Starts farming process.
 * Saves account to database
 * Returns a promise with account
 */
module.exports.startFarming = async function (userId, accountId, client, doc) {
    // don't get client or doc if they were passed
    if (!client) {
        // check account is online
        client = this.isAccountOnline(userId, accountId);
        if (!client) {
            return Promise.reject("Account is not online.");
        }

        // get account doc
        doc = await this.getAccount({ userId: userId, accountId: accountId });
        if (!doc) {
            return Promise.reject("Account not found.");
        }

        if (doc.isFarming) {
            return Promise.reject("Account is already farming");
        }

    }

    if (doc.farmingData.length == 0) {
        return Promise.reject("No games to farm.");
    }

    // Get 32 games with cards lefts
    doc.farmingGames = this.get32GameAppIds(doc.farmingData);

    // Play games
    doc.status = client.playGames(doc.farmingGames)
    // turn on farming mode
    doc.isFarming = true;

    // set nextFarmingCheck
    if (doc.nextFarmingCheck == 0) {
        doc.nextFarmingCheck = Date.now() + this.FARMING_RECHECK_INTERVAL
    } else {
        // Figure out the correct interval
        let remainingTime = doc.nextFarmingCheck - Date.now()
        // too much time has past, just set default interval
        if (remainingTime < 0) {
            doc.nextFarmingCheck = Date.now() + this.FARMING_RECHECK_INTERVAL
        } else { // leave nextFarmingCheck as is + time lost to reconnect the account
            doc.nextFarmingCheck += (3 * 60 * 1000) // 3 minutes extra
        }
    }

    client.farmingReCheckId = setTimeout(() => {
        this.FarmingRecheck(doc.userId, doc._id)
    }, doc.nextFarmingCheck - Date.now());

    await this.saveAccount(doc);
    return Promise.resolve(this.filterSensitiveAcc(doc))
}

// Farming checker. How many cards have dropped after an interval
module.exports.FarmingRecheck = async function (userId, accountId) {
    // Get account from Db
    let doc = await this.getAccount({ accountId: accountId })
    if (!doc) {
        console.log(`ERROR: FarmingRecheck: account not found > accountId: ${accountId} userId: ${userId}`)
        return;
    }

    // check account is online
    let client = this.isAccountOnline(userId, accountId);
    if (!client) {
        console.log(`ERROR: FarmingRecheck: account is not online > : ${doc.user}`)
        doc.isFarming = false;
        this.saveAccount(doc);
        return;
    }

    // restart game idling 5 sec delay
    await this.restartIdling(doc.farmingGames, client)

    // Get farming data
    doc.farmingData = await this.getFarmingData(client)

    // done farming
    if (doc.farmingData.length == 0) {
        //stop farming
        this.stopFarming(null, null, client, doc)
        return;
    }

    // Get 32 games to farm
    doc.farmingGames = this.get32GameAppIds(doc.farmingData);
    client.playGames(doc.farmingGames);
    doc.nextFarmingCheck = Date.now() + this.FARMING_RECHECK_INTERVAL
    this.saveAccount(doc);

    client.farmingReCheckId = setTimeout(() => {
        this.FarmingRecheck(userId, accountId);
    }, this.FARMING_RECHECK_INTERVAL);
}

/**
 * Gets farming data for account.
 * Function does not fail.
 * Returns a promise
 */
module.exports.getFarmingData = async function (client) {
    let self = this;
    return new Promise(async resolve => {
        (async function attempt() {
            try {
                let farmingData = await client.GetFarmingData();
                return resolve(farmingData);
            } catch (error) {
                setTimeout(() => attempt(), self.FARMING_GETFARMINGDATA_RETRYTIME);
            }
        })();
    })
}

/**
 * Stops farming processs
 * Saves account to database
 * Returns a promise
 */
module.exports.stopFarming = async function (userId, accountId, client, doc) {
    if (!client) {
        // check account is online
        client = this.isAccountOnline(userId, accountId);
        if (!client) {
            return Promise.reject("Account is not online.");
        }

        // get account doc
        doc = await this.getAccount({ userId: userId, accountId: accountId })
        if (!doc) {
            return Promise.reject("Account not found.");
        }

        if (!doc.isFarming) {
            return Promise.reject("Account is not farming.");
        }
    }

    clearInterval(client.farmingReCheckId);
    // Idle gamesPlaying instead 
    doc.status = client.playGames(doc.gamesPlaying)
    doc.nextFarmingCheck = 0;
    doc.farmingGames = [];
    doc.isFarming = false;

    await this.saveAccount(doc);
    return Promise.resolve(this.filterSensitiveAcc(doc))
}

/**
 * Restarts idling games with a 5 second delay
 * Returns a promise
 */
module.exports.restartIdling = async function (games, client) {
    let self = this;
    return new Promise(resolve => {
        client.playGames([]);
        setTimeout(() => {
            client.playGames(games);
            return resolve();
        }, self.FARMING_RESTARTIDLING_DELAY);
    })
}

/**
 * Returns 32 appIds from farmingData
 * 32 is the allowed playing games by steam
 */
module.exports.get32GameAppIds = function (farmingData) {
    let appId = [];
    for (let i = 0; i < farmingData.length; i++) {
        appId.push({ game_id: farmingData[i].appId })
        if (i == 31) {
            break;
        }
    }
    return appId;
}
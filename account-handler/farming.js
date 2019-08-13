/************************************************************************
* 					          FARMING FUNCTIONS					        *
************************************************************************/


/**
 * Starts farming process.
 * Saves account to database
 * Returns a promise with account
 */
module.exports.startFarming = async function (userId, accountId, client, doc) {
    let self = this;

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
    doc.nextFarmingCheck = Date.now() + self.FARMING_RECHECK_INTERVAL
    // save account
    doc = await this.saveAccount(doc);
    // set interval
    client.farmingReCheckId = setInterval(() => reCheck(), self.FARMING_RECHECK_INTERVAL);
    // store accountId
    client.accountId = doc._id;

    async function reCheck() {
        // account not logged in, stop farming algorithm
        if (!client.loggedIn) {
            clearInterval(client.farmingReCheckId);
            return;
        }

        // Get account from Db
        doc = await self.getAccount({ accountId: client.accountId })
        if (!doc) {
            clearInterval(client.farmingReCheckId);
            throw `Did not find accountId ${client.accountId} in reCheck()`
        }

        // update nextFarmingCheck
        doc.nextFarmingCheck = Date.now() + self.FARMING_RECHECK_INTERVAL

        // restart game idling
        await self.restartIdling(doc.farmingGames, client)

        // Get farming data
        doc.farmingData = await self.getFarmingData(client)

        // done farming
        if (doc.farmingData.length == 0) {
            //stop farming
            self.stopFarming(null, null, client, doc)
            return;
        }

        // Get 32 games to farm
        doc.farmingGames = self.get32GameAppIds(doc.farmingData);
        client.playGames(doc.farmingGames);
        self.saveAccount(doc);
    }

    let filteredDoc = self.filterSensitiveAcc(doc)
    return Promise.resolve(filteredDoc)
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
    // Idle gamesPlaying
    doc.status = client.playGames(doc.gamesPlaying)
    doc.nextFarmingCheck = 0;
    doc.farmingGames = [];
    doc.isFarming = false;
    doc = await this.saveAccount(doc);
    doc = this.filterSensitiveAcc(doc);
    return Promise.resolve(doc)
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
        if(i == 31){
            break;
        }
    }
    return appId;
}
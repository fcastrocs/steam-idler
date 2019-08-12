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
        doc = await this.getAccount(userId, accountId);
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

    // Get games with cards lefts
    doc.gamesPlaying = this.getAllGameAppIds(doc.farmingData);
    // Play games
    doc.status = client.playGames(doc.gamesPlaying)
    // turn on farming mode
    doc.isFarming = true;
    // set nextFarmingCheck
    doc.nextFarmingCheck = Date.now() + self.FARMING_RECHECK_INTERVAL
    // save account
    doc = await this.saveAccount(doc);
    // set interval
    client.farmingReCheckId = setInterval(() => reCheck(), self.FARMING_RECHECK_INTERVAL);

    async function reCheck() {
        // account not logged in, stop farming algorithm
        if (!client.loggedIn) {
            clearInterval(client.farmingReCheckId);
            return;
        }

        // update nextFarmingCheck
        doc.nextFarmingCheck = Date.now() + self.FARMING_RECHECK_INTERVAL

        // restart game idling
        await self.restartIdling(doc.gamesPlaying, client)

        // Get farming data
        doc.farmingData = await self.getFarmingData(client)

        // done farming
        if (doc.farmingData.length == 0) {
            //stop farming
            self.stopFarming(null, null, client, doc)
            return;
        }

        // Get games to idle
        doc.gamesPlaying = self.getAllGameAppIds(doc.farmingData);
        client.playGames(doc.gamesPlaying);
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
        doc = await this.getAccount(userId, accountId);
        if (!doc) {
            return Promise.reject("Account not found.");
        }

        if (!doc.isFarming) {
            return Promise.reject("Account is not farming.");
        }
    }

    clearInterval(client.farmingReCheckId);
    doc.status = client.playGames([])
    doc.gamesPlaying = [];
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
 * Returns all game appIds from farmingData 
 */
module.exports.getAllGameAppIds = function (farmingData) {
    let appId = [];
    for (let i in farmingData) {
        appId.push({ game_id: farmingData[i].appId })
    }
    return appId;
}
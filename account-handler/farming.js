/************************************************************************
* 					          FARMING FUNCTIONS					        *
************************************************************************/


/**
 * Starts farming process.
 * Saves account to database
 * Returns a promise
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

    // save account
    this.saveAccount(doc);

    // set interval
    client.farmingReCheckId = setInterval(() => reCheck(), this.reCheckInterval);

    // set nextFarmingCheck
    doc.nextFarmingCheck = Date.now() + self.reCheckInterval

    async function reCheck() {
        // account not logged in, stop farming algorithm
        if (!client.loggedIn) {
            clearInterval(client.farmingReCheckId);
            return;
        }

        // update nextFarmingCheck
        doc.nextFarmingCheck = Date.now() + self.reCheckInterval

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

    return Promise.resolve("okay")
}

/**
 * Gets farming data for account.
 * Function does not fail.
 * Returns a promise
 */
module.exports.getFarmingData = async function (client) {
    return new Promise(async resolve => {
        (async function attempt() {
            try {
                let farmingData = await client.GetFarmingData();
                return resolve(farmingData);
            } catch (error) {
                setTimeout(() => {
                    attempt();
                }, 8000);
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
    await this.saveAccount(doc);

    return Promise.resolve("okay")
}


/**
 * Restarts idling games with a 5 second delay
 * Returns a promise
 */
module.exports.restartIdling = async function (games, client) {
    return new Promise(resolve => {
        client.playGames([]);
        setTimeout(() => {
            client.playGames(games);
            return resolve();
        }, 5000);
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
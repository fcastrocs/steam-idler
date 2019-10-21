/**
 * Sets account to play games or to stop playing games if empty array
 * @param {*} games games array to play
 * @returns account status: "In-game" or "Online"
 */
module.exports.playGames = function (games) {
    if (!this.loggedIn) {
        return;
    }
    this.client.playGames(games);

    if (games.length > 0) {
        return "In-game"
    } else {
        return "Online"
    }
}

/**
 * Activate F2P games
 * @param {*} appIds array of appIDs to activate
 * @returns Promise with activated games
 */
module.exports.activateF2pGames = function(appIds) {
    if (!this.loggedIn) {
        return;
    }

    return new Promise((resolve, reject) => {
        // register the event first
        this.client.once('activated-f2p-games', games => {
            if (!games) {
                reject("Could not activate game(s).")
            } else {
                resolve(games)
            }
        })
        this.client.activateF2pGames(appIds)
    })
}

/**
 * Redeem a cdkey
 * @param {*} cdkey
 * @returns activated game
 */
module.exports.redeemKey = function(cdkey) {
    if (!this.loggedIn) {
        return;
    }

    return new Promise((resolve, reject) => {
        // register the event first
        this.client.once('redeem-key', games => {
            if (Array.isArray(games)) {
                resolve(games)
            } else {
                reject(games)
            }
        })
        this.client.redeemKey(cdkey)
    })
}

/**
 * Change account status
 * @param {*} state Offline: 0, Online: 1, Busy: 3, Away: 3, Snooze: 4,
 * LookingToTrade: 5, LookingToPlay: 6, Invisible: 7
 * @param {*} name Optional, persona name
 */
module.exports.setPersona = function(state, name) {
    if (!this.loggedIn) {
        return;
    }
    // Save status if account loses connection
    this.account.forcedStatus = state;
    if (state == "Online") {
        state = 1;
    } else if (state == "Busy") {
        state = 2;
    } else if (state == "Away") {
        state = 3;
    } else if (state == "Invisible") {
        state = 7
    }

    this.client.setPersona(state, name)
}
const Router = require('express').Router();
const apiLimiter = require('./util/api-limiter');
const AccountHandler = require("../app").accountHandler

/**
 * Middleware to remove API limit before sending response
 */
Router.use("/steamaccount/*", apiLimiter);

// Add a new steam account
Router.post("/steamaccount/add", async (req, res) => {
    if (!req.body.user || !req.body.pass) {
        return res.status(400).send("User/pass parameters needed.")
    }

    if (!req.body.socketId) {
        return res.status(400).send("socket ID needed.")
    }
    
    // setup login options
    let options = {
        user: req.body.user.toLowerCase().trim(),
        pass: req.body.pass,
        shared_secret: req.body.sharedSecret,
        socketId: req.body.socketId
    }

    try {
        let result = await AccountHandler.addAccount(req.session.userId, options)
        return res.send(result);
    } catch (error) {
        console.error(error)
        return res.status(400).send(error)
    }
})


// connects a steam account to steam
Router.post('/steamaccount/login', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    if (!req.body.socketId) {
        return res.status(400).send("socket ID needed.")
    }

    try {
        let doc = await AccountHandler.loginAccount(req.session.userId, req.body.accountId, {
            socketId: req.body.socketId
        })

        return res.send(doc);
    } catch (error) {
        console.error(error)
        return res.status(400).send(error)
    }
})


// connects a steam account to steam
Router.post('/steamaccount/logout', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed")
    }

    try {
        let result = await AccountHandler.logoutAccount(req.session.userId, req.body.accountId)
        return res.send(result);
    } catch (error) {
        console.error(error)
        return res.status(400).send(error)
    }
})

// 
Router.post('/steamaccount/playgames', async function (req, res) {
    if (!req.body.games || !req.body.accountId || (req.body.games.length == 0)) {
        return res.status(400).send("games/accountId parameters needed.")
    }

    //do not allow more than 32 games
    if (req.body.games.length > 32) {
        return res.status(400).send("More than 32 games is not allowed.")
    }

    // Format array so steam accepts it
    let games = req.body.games.map(gameId => { return { game_id: gameId } })

    try {
        let result = await AccountHandler.playGames(req.session.userId, req.body.accountId, games)
        return res.send(result);
    } catch (error) {
        console.error(error)
        return res.status(400).send(error)
    }
})

/**
 * Get inventory
 */
Router.post("/steamaccount/refreshinventory", async function (req, res){
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    await AccountHandler.getInventory(req.session.userId, req.body.accountId);
    return res.send("inventory refreshed");
})

// Stop playing games
Router.post('/steamaccount/stopgames', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    try {
        let result = await AccountHandler.playGames(req.session.userId, req.body.accountId, [])
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

// Change nickname
Router.post('/steamaccount/changenick', async function (req, res) {
    if (!req.body.accountId || !req.body.nickname) {
        return res.status(400).send("accountId/nickname parameters needed")
    }

    try {
        let result = await AccountHandler.changeNick(req.session.userId, req.body.accountId, req.body.nickname)
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

// Redeem key
Router.post('/steamaccount/redeemkey', async function (req, res) {
    if (!req.body.accountId || !req.body.cdkey) {
        return res.status(400).send("accountId/cdkey parameters needed.")
    }

    try {
        let result = await AccountHandler.redeemKey(req.session.userId, req.body.accountId, req.body.cdkey)
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

// Redeem key
Router.post('/steamaccount/setstatus', async function (req, res) {
    if (!req.body.accountId || !req.body.status) {
        return res.status(400).send("accountId/status parameters needed.")
    }

    let status = req.body.status;

    if (status != "Online" && status != "Invisible" && status != "Away" && status != "Snooze" && status != "Busy") {
        return res.status(400).send("Invalid status.")
    }

    try {
        let result = await AccountHandler.setStatus(req.session.userId, req.body.accountId, status);
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

Router.post('/steamaccount/startfarming', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    try {
        let result = await AccountHandler.startFarming(req.session.userId, req.body.accountId);
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

Router.post('/steamaccount/stopfarming', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    try {
        let result = await AccountHandler.stopFarming({
            userId: req.session.userId,
            accountId: req.body.accountId,
        });
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

Router.post('/steamaccount/changeavatar', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    if (!req.body.binaryImg) {
        return res.status(400).send("binaryImg parameter needed.")
    }

    if (!req.body.filename) {
        return res.status(400).send("filename parameter needed.")
    }

    let accountId = req.body.accountId;
    let userId = req.session.userId;
    let binaryImg = req.body.binaryImg;
    let filename = req.body.filename;

    try {
        let result = await AccountHandler.changeAvatar(userId, accountId, binaryImg, filename);
        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

Router.post("/steamaccount/clearaliases", async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.");
    }

    try {
        await AccountHandler.clearAliases(req.session.userId, req.body.accountId);
        return res.send("clear aliases")
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
})

Router.post("/steamaccount/changeprivacy", async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.");
    }

    if (!req.body.formData) {
        return res.status(400).send("formData parameter needed.");
    }

    try {
        await AccountHandler.changePrivacy(req.session.userId, req.body.accountId, req.body.formData);
        return res.send("changed privacy")
    } catch (error) {
        console.error(error);
        return res.status(400).send(error);
    }
})

// Removes a steam account
Router.delete('/steamaccount', async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    try {
        // try to logout account
        let response = await AccountHandler.deleteAccount(req.session.userId, req.body.accountId);
        // At this point, the account has been logged out and its handler's been destroyed
        return res.send(response)
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

Router.post('/steamaccount/activatefreegames', async (req, res) => {
    if (!req.body.accountId) {
        return res.status(400).send("accountId parameter needed.")
    }

    if (!req.body.freeToPlay && !req.body.freePromo) {
        return res.status(400).send("Need to specify p2p or promoGame.")
    }

    // if f2p
    if (req.body.freeToPlay) {
        if (!req.body.appIds) {
            return res.status(400).send("appIds parameter needed.")
        }

        // validation
        var appIds = req.body.appIds.split(",").map(Number).filter(item => !isNaN(item))
        if (appIds.length < 1) {
            return res.status(400).send("Invalid input, enter valid app Ids.")
        }
    } else { // free promo game
        if (!req.body.packageId) {
            return res.status(400).send("packageId parameter needed.")
        }

        // validation
        var packageId = parseInt(req.body.packageId);
        if (Number.isNaN(packageId)) {
            return res.status(400).send("Invalid input, enter a valid package Id.")
        }
    }

    try {
        let result;
        if (req.body.freeToPlay) {
            result = await AccountHandler.activateF2pGames(req.session.userId, req.body.accountId, appIds)
        } else {
            result = await AccountHandler.activateFreePromoGame(req.session.userId, req.body.accountId, packageId)
        }

        return res.send(result);
    } catch (error) {
        console.error(error);
        return res.status(400).send(error)
    }
})

module.exports = Router;
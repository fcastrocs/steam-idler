const Router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn')
const AccountHandler = require("../app")

// Returns all accounts for this user
Router.get('/steamaccounts', isLoggedIn, async (req, res) => {
    try {
        let result = await AccountHandler.getAllAccounts(req.session.userId)
        return res.send(result);
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Add a new steam account
Router.post("/steamaccount/add", isLoggedIn, async (req, res) => {
    if (!req.body.user || !req.body.pass) {
        return res.status(400).send("user/pass needed")
    }

    let account = {
        user: req.body.user.toLowerCase().trim(),
        pass: req.body.pass,
        emailGuard: req.body.emailGuard,
        shared_secret: req.body.sharedSecret
    }

    try {
        let result = await AccountHandler.addAccount(req.session.userId, account)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }

})


// connects a steam account to steam
Router.post('/steamaccount/login', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId needed")
    }

    try {
        let result = await AccountHandler.loginAccount(req.session.userId, req.body.accountId)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})



// connects a steam account to steam
Router.post('/steamaccount/logout', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId needed")
    }

    try {
        let result = await AccountHandler.logoutAccount(req.session.userId, req.body.accountId)
        return res.send(result);
    } catch (error) {
        console.log(error)
        return res.status(400).send(error)
    }
})

// 
Router.post('/steamaccount/playgames', isLoggedIn, async function (req, res) {
    if (!req.body.games || !req.body.accountId || (req.body.games.length < 1)) {
        return res.status(400).send("games/accountId needed")
    }

    // string to array
    let games = req.body.games.split(" ");

    //do not allow more than 33 games
    if (games.length > 33) {
        return res.status(400).send("More than 33 games is not allowed.")
    }
    // Format array so steam accepts it
    games = games.map(gameId => { return { game_id: gameId } })

    try {
        let result = await AccountHandler.playGames(req.session.userId, req.body.accountId, games)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})


// Stop playing games
Router.post('/steamaccount/stopgames', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId needed")
    }

    try {
        let result = await AccountHandler.playGames(req.session.userId, req.body.accountId, [])
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Change nickname
Router.post('/steamaccount/changenick', isLoggedIn, async function (req, res) {
    if (!req.body.accountId || !req.body.nickname) {
        return res.status(400).send("accountId/nickname needed")
    }

    try {
        let result = await AccountHandler.changeNick(req.session.userId, req.body.accountId, req.body.nickname)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Activate free game
Router.post('/steamaccount/activatefreegame', isLoggedIn, async function (req, res) {
    if (!req.body.accountId || !req.body.appIds) {
        return res.status(400).send("accountId/appIds needed")
    }

    // validation
    let appIds = req.body.appIds.split(",").map(Number).filter(item => !isNaN(item))

    if (appIds.length < 1) {
        return res.status(400).send("appIds must be a valid number string.")
    }

    try {
        let result = await AccountHandler.activateFreeGame(req.session.userId, req.body.accountId, appIds)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Redeem key
Router.post('/steamaccount/redeemkey', isLoggedIn, async function (req, res) {
    if (!req.body.accountId || !req.body.cdkey) {
        return res.status(400).send("accountId/cdkey needed")
    }

    try {
        let result = await AccountHandler.redeemKey(req.session.userId, req.body.accountId, req.body.cdkey)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})


// Redeem key
Router.post('/steamaccount/setstatus', isLoggedIn, async function (req, res) {
    if (!req.body.accountId || !req.body.status) {
        return res.status(400).send("accountId/status needed")
    }

    let status = req.body.status;

    if (status != "Online" && status != "Invisible" && status != "Away" && status != "Snooze" && status != "Busy") {
        return res.status(400).send("Invalid status")
    }

    try {
        let result = await AccountHandler.setStatus(req.session.userId, req.body.accountId, status);
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

Router.post('/steamaccount/startfarming', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId needed")
    }

    try {
        let result = await AccountHandler.startFarming(req.session.userId, req.body.accountId);
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

Router.post('/steamaccount/stopfarming', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("accountId needed")
    }

    try {
        let result = await AccountHandler.stopFarming(req.session.userId, req.body.accountId);
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Removes a steam account
Router.delete('/steamaccount', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("Bad deleteacc request.")
    }

    try {
        // try to logout account
        let response = await AccountHandler.deleteAccount(req.session.userId, req.body.accountId);
        // At this point, the account has been logged out and its handler's been destroyed
        return res.send(response)
    } catch (error) {
        return res.status(400).send(error)
    }
})

module.exports = Router;
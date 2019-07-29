const express = require('express');
const router = express.Router();
const SteamAccounts = require('../models/steam-accounts')
const isLoggedIn = require('./util/isLoggedIn')
const AccountHandler = require("../app")

// Redirect to dashboard if already logged in
router.get("/", isLoggedIn, (req, res) => {
    res.redirect(`/dashboard/${req.session.username}`);
});

// Dashboard
router.get(`/dashboard/:username`, isLoggedIn, (req, res) => {
    if (req.params.username === req.session.username) {
        res.render('dashboard', { username: req.session.username })
    } else {
        console.log('access denied');
    }
});


/* STEAM ACCOUNT ROUTES */

// Returns all accounts for this user
router.get('/dashboard/steamacc/get', isLoggedIn, (req, res) => {
    SteamAccounts.find({ userId: req.session.userId }, 'persona_name games status gamesPlaying avatar steamid', (err, accounts) => {
        if (err) {
            throw err;
        }

        if (!accounts) {
            return res.send(null);
        }

        res.send(accounts)
    })
})

// Adds a new steam account to the collection
router.post('/dashboard/addacc', isLoggedIn, async function (req, res) {
    if (!req.body.user || !req.body.pass) {
        return res.status(400).send('Bad addacc request')
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
        console.log(error)
        return res.status(400).send(error)
    }
})

// connects a steam account to steam
router.post('/dashboard/loginaccount', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("Bad login request.")
    }

    try {
        let result = await AccountHandler.loginAccount(req.session.userId, req.body.accountId)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// connects a steam account to steam
router.post('/dashboard/logoutaccount', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("Bad logout request.")
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
router.post('/dashboard/playgames', isLoggedIn, async function (req, res) {
    if (!req.body.games || !req.body.accountId || (req.body.games.length < 1)) {
        return res.status(400).send("Bad playgames request.")
    }

    // string to array
    let games = req.body.games.split(" ");

    //do not allow more than 30 games
    if (games.length > 30) {
        return res.send("More than 30 games is not allowed.")
    }

    try {
        let result = await AccountHandler.playGames(games, req.session.userId, req.body.accountId)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})


// Stop playing games
router.post('/dashboard/stopgames', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("Bad stopgames request.")
    }

    try {
        let result = await AccountHandler.playGames([], req.session.userId, req.body.accountId)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Change nickname
router.post('/dashboard/changenick', isLoggedIn, async function (req, res) {
    if (!req.body.accountId || !req.body.nickname) {
        return res.status(400).send("Bad changenick request.")
    }

    try {
        let result = await AccountHandler.changeNick(req.session.userId, req.body.accountId, req.body.nickname)
        return res.send(result);
    } catch (error) {
        console.log(error)
        return res.status(400).send(error)
    }
})



// Activate free game
router.post('/dashboard/activatefreegame', isLoggedIn, async function (req, res) {
    if (!req.body.accountId || !req.body.appId) {
        return res.status(400).send("Bad activatefreegame request.")
    }

    try {
        let result = await AccountHandler.activateFreeGame(req.session.userId, req.body.accountId, req.body.appId)
        return res.send(result);
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Removes a steam account
router.delete('/dashboard/deleteacc', isLoggedIn, async function (req, res) {
    if (!req.body.accountId) {
        return res.status(400).send("Bad deleteacc request.")
    }

    try {
        // try to logout account
        await AccountHandler.logoutAccount(req.session.userId, req.body.accountId);
        // At this point, the account has been logged out and its handler's been destroyed

    } catch (error) {
        if (error !== "Account not logged in.") {
            return res.status(400).send(error)
        }
    }

    // Now delete the account
    await SteamAccounts.findOneAndDelete({ userId: req.session.userId, _id: req.body.accountId })
    return res.send("deleted")
})



// ACCOUNT HANDLER ROUTES

module.exports = router;
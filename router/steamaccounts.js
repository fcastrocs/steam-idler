const Router = require('express').Router();
const apiLimiter = require('./util/api-limiter');
const AccountHandler = require("../app").accountHandler
const allSettled = require('promise.allsettled');

/**
 * Middleware to remove API limit before sending response
 */
Router.use("/steamaccounts/*", apiLimiter);

// Returns all accounts for this user
Router.get('/steamaccounts', async (req, res) => {
    try {
        let result = await AccountHandler.getAllAccounts(req.session.userId)
        return res.send(result);
    } catch (error) {
        console.error(error)
        return res.status(500).send("Could not fetch user accounts.")
    }
})

/**
 * Login all accounts
 */
Router.post('/steamaccounts/login', async function (req, res) {
    try {
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        if (!req.body.socketId) {
            return res.status(400).send("socket ID needed.")
        }

        // Log in all accounts
        let promises = [];
        for (let i in accounts) {
            promises.push(AccountHandler.loginAccount(req.session.userId, accounts[i]._id, {
                account: accounts[i],
                socketId: req.body.socketId
            }))
        }

        allSettled(promises).then(results => {
            let fulfilled = 0;
            results.forEach(result => {
                if (result.status === "fulfilled") {
                    fulfilled++;
                }
            })

            if (fulfilled == 0) {
                return res.status(400).send("All your accounts are already online.")
            } else {
                return res.send(`${fulfilled} accounts were logged in.`)
            }
        })

    } catch (res) {
        console.error(res);
        return res.status(500).send("Could not login your accounts.")
    }
})

/**
 * Logout all accounts
 */
Router.post('/steamaccounts/logout', async function (req, res) {
    try {
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        // Log in all accounts
        let promises = [];
        for (let i in accounts) {
            promises.push(AccountHandler.logoutAccount(req.session.userId, accounts[i]._id))
        }

        allSettled(promises).then(() => {
            return res.send("Accounts logged out.")
        })

    } catch (res) {
        console.error(res);
        return res.status(500).send("Could not logout your accounts.")
    }
})

/**
 * Set status to all accounts
 */
Router.post('/steamaccounts/setstatus', async function (req, res) {
    let status = req.body.status;

    if (!status) {
        return res.status(400).send("status parameter needed.")
    }

    if (status != "Online" && status != "Invisible" && status != "Away" && status != "Snooze" && status != "Busy") {
        return res.status(400).send("Invalid status parameter.")
    }

    try {
        // get all user accounts
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        let promises = []
        for (let i in accounts) {
            promises.push(AccountHandler.setStatus(req.session.userId, accounts[i]._id, status, { account: accounts[i] }))
        }

        allSettled(promises).then(() => {
            return res.send("status set");
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send("Could not set status for your accounts.")
    }
})

/**
 * Stop idling
 */
Router.post('/steamaccounts/stopidling', async function (req, res) {
    try {
        // get all user accounts
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        let promises = []
        for (let i in accounts) {
            promises.push(AccountHandler.playGames(req.session.userId, accounts[i]._id, [], { account: accounts[i] }))
        }

        allSettled(promises).then(() => {
            return res.send("Accounts stopped idling.");
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send("Could not stop your accounts from idling.")
    }
})


/**
 * Activate f2p or free promo game
 */
Router.post('/steamaccounts/activatefreegames', async (req, res) => {
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
        // get all user accounts
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        let promises = []
        for (let i in accounts) {
            if (req.body.freeToPlay) {
                promises.push(AccountHandler.activateF2pGames(req.session.userId, accounts[i]._id, appIds, { account: accounts[i] }))

            } else {
                promises.push(AccountHandler.activateFreePromoGame(req.session.userId, accounts[i]._id, packageId, { account: accounts[i] }))
            }
        }

        let resolved = 0
        let games = null
        allSettled(promises).then((result) => {
            result.forEach(res => {
                if (res.status === "fulfilled") {
                    games = res.value;
                    resolved++
                }
            })

            if (resolved == 0) {
                return res.status(400).send("Game(s) activation failed, check you've entered the correct info.")
            } else {
                return res.send({ games: games, msg: `Game(s) activated in ${resolved} accounts.` })
            }
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send("Could not activate game(s) to your accounts.")
    }
})


module.exports = Router;
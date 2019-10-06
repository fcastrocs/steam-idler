const Router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn')
const apiLimiter = require('./util/api-limiter');
const AccountHandler = require("../app").accountHandler
const allSettled = require('promise.allsettled');

// Remove API limit before sending response
Router.use("/steamaccounts/*", function (req, res, next) {
    let send = res.send;
    res.send = function (body) {
        // This will prevent this from being called twice, as res.send is called twice
        if (typeof (body) === 'string' && !res.dontRemoveApiLimit) {
            apiLimiter.remove(req.session.userId);
        }
        send.call(this, body);
    }
    next();
})

// Returns all accounts for this user
Router.get('/steamaccounts', isLoggedIn, async (req, res) => {
    try {
        let result = await AccountHandler.getAllAccounts(req.session.userId)
        return res.send(result);
    } catch (error) {
        console.log(error)
        return res.status(500).send("Could not fetch all user accounts.")
    }
})

Router.post('/steamaccounts/login', [isLoggedIn, apiLimiter.checker], async function (req, res) {
    try {
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        if (!req.body.socketId) {
            apiLimiter.remove(req.session.userId);
            return res.status(400).send("socket ID needed.")
        }

        // Log in all accounts
        let promises = [];
        for (let i in accounts) {
            promises.push(AccountHandler.loginAccount(req.session.userId, accounts[i]._id, {
                dontGetAccount: true,
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
                return res.status(400).send("It appears all your accounts are already online.")
            } else {
                return res.send(`${fulfilled} accounts were logged in.`)
            }
        })

    } catch (res) {
        console.log(res);
        return res.status(500).send("Could not login your accounts.")
    }
})

Router.post('/steamaccounts/logout', [isLoggedIn, apiLimiter.checker], async function (req, res) {
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
        console.log(res);
        return res.status(500).send("Could not logout your accounts.")
    }
})

Router.post('/steamaccounts/setstatus', [isLoggedIn, apiLimiter.checker], async function (req, res) {
    if (!req.body.status) {
        return res.status(400).send("status param needed.")
    }

    let status = req.body.status;
    if (status != "Online" && status != "Invisible" && status != "Away" && status != "Snooze" && status != "Busy") {
        return res.status(400).send("Invalid status param.")
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
        console.log(error)
        return res.status(500).send("Could not set status for your accounts.")
    }
})

Router.post('/steamaccounts/stopgames', [isLoggedIn, apiLimiter.checker], async function (req, res) {
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
        console.log(error)
        return res.status(500).send("Could not stop your accounts from idling.")
    }
})


// Activate f2p game
Router.post('/steamaccounts/activatefreetoplaygames', [isLoggedIn, apiLimiter.checker], async (req, res) => {
    try {
        if (!req.body.appIds) {
            return res.status(400).send("appIds param needed")
        }

        // validation
        let appIds = req.body.appIds.split(",").map(Number).filter(item => !isNaN(item))
        if (appIds.length < 1) {
            return res.status(400).send("Invalid input, enter valid appIds.")
        }

        // get all user accounts
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        let promises = []
        for (let i in accounts) {
            promises.push(AccountHandler.activateFreeGame(req.session.userId, accounts[i]._id, appIds, { account: accounts[i] }))
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
                return res.status(400).send("Game activation failed in all accounts.")
            } else {
                return res.send({ games: games, msg: `Game activated in ${resolved} accounts.` })
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).send("Could not activate games to your accounts.")
    }
})


module.exports = Router;
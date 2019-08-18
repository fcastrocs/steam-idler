const Router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn')
const apiLimiter = require('./util/api-limiter');
const AccountHandler = require("../app")
const allSettled = require('promise.allsettled');

Router.post('/steamaccounts/login', [isLoggedIn, apiLimiter.checker], async function (req, res) {
    try {
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        // Log in all accounts
        let promises = [];
        for (let i in accounts) {
            promises.push(AccountHandler.loginAccount(req.session.userId, accounts[i]._id, {
                dontGetAccount: true,
                account: accounts[i]
            }))
        }

        allSettled(promises).then(results => {
            // remove api limiter
            apiLimiter.remove(req.session.userId);

            let fulfilled = 0;
            let rejected = 0;
            results.forEach(result => {
                if (result.status === "fulfilled") {
                    fulfilled++;
                } else {
                    rejected++;
                }
            })
            return res.send(`${fulfilled} accounts logged in, ${rejected} could not be logged in.`)
        })

    } catch (res) {
        console.log(res);
        return res.status(500).send("Could not fetch accounts")
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
            // remove api limiter
            apiLimiter.remove(req.session.userId);
            return res.send();
        })

    } catch (res) {
        console.log(res);
        return res.status(500).send("Could not fetch accounts")
    }
})

Router.post('/steamaccounts/setstatus', [isLoggedIn, apiLimiter.checker], async function (req, res) {
    if (!req.body.status) {
        return res.status(400).send("status needed")
    }

    let status = req.body.status;
    if (status != "Online" && status != "Invisible" && status != "Away" && status != "Snooze" && status != "Busy") {
        return res.status(400).send("Invalid status")
    }

    try {
        // get all user accounts
        let accounts = await AccountHandler.getAllAccounts(req.session.userId, { dontFilter: true })
        if (accounts.length == 0) {
            return res.status(400).send("You don't have any accounts.")
        }

        let promises = []
         for (let i in accounts) {
            promises.push(AccountHandler.setStatus(req.session.userId, null, status, {account: accounts[i]}))
         }

         allSettled(promises).then(() => {
            // remove api limiter
            apiLimiter.remove(req.session.userId);
            return res.send();
        })
    } catch (error) { 
        return res.status(500).send(error)
    }
})

module.exports = Router;
const express = require('express');
const router = express.Router();
const isLoggedIn = require('./util/isLoggedIn')
const isAdmin = require("./util/isAdmin")
const Proxies = require('../util/proxy').GetAndSaveProxies;
const SteamCMs = require('../util/steamcm').GetAndSaveSteamCMs;
const Proxy = require('../models/proxy');
const SteamCM = require('../models/steamcm')
const Mailer = require("../mailer")
const Invite = require("../models/invite")
const Security = require("../util/security")
const Users = require("../models/user");
const Accounts = require("../models/steam-accounts");
const AccountHandler = require("../app").accountHandler

router.get(`/admin`, isLoggedIn, (req, res) => {
    if (!req.session.admin) {
        return res.redirect("/");
    }
    Proxy.countDocuments({}, (err, proxyCount) => {
        SteamCM.countDocuments({}, (err, steamcmsCount) => {
            res.render('admin', {
                proxyCount: proxyCount,
                steamcmsCount: steamcmsCount,
                header: function () {
                    return "dashboard-header"
                }
            })
        });
    });
});

/**
 * Responds with array of users { _id, username, accountsCount, loggedAccountsCount}
 */
router.get("/admin/userlist", [isLoggedIn, isAdmin], async(req,res)=>{
    try{
        let usersList = await Users.find({}, "_id username").exec();
        let users = []
        for(let i = 0; i < usersList.length; i++){
            let user = {};
            user._id = usersList[i]._id;
            user.username = usersList[i].username;
            // get account count
            let count = await Accounts.countDocuments({userId: usersList[i]._id}).exec();
            user.accountsCount = count;
            user.loggedAccountsCount = 0;
            let loggedInAccounts = AccountHandler.userAccounts[usersList[i]._id];
            if(loggedInAccounts){
                user.loggedAccountsCount = Object.keys(loggedInAccounts).length;
            }
            users.push(user);
            // responde on that iteration
            if(i == usersList.length - 1){
                res.send(users);
            }
        }
    }catch(err){
        console.log(err);
        res.status(500).send("Could not get userlist")
    }
})

// Renew proxies
router.post(`/admin/renewproxies`, [isLoggedIn, isAdmin], async (req, res) => {
    try {
        let count = await Proxies();
        res.send(`${count}`)
    } catch (error) {
        res.status(500).send("Could not fetch proxies")
    }
})

// Renew steamcms
router.post(`/admin/renewsteamcms`, [isLoggedIn, isAdmin], async (req, res) => {
    try {
        let count = await SteamCMs();
        res.send(`${count}`)
    } catch (error) {
        res.status(500).send("Could not fetch proxies")
    }
})


// send invite
router.post(`/admin/sendinvite`, [isLoggedIn, isAdmin], (req, res) => {
    if (!req.body.email) {
        return res.status(400).send("Need email.");
    }

    //create new invite
    let invite = new Invite({
        token: Security.createToken()
    })

    invite.save(async err => {
        if (err) {
            return res.status(500).send("Could not generate invite.")
        }
        
        let url = `https://${req.headers.host}/invite/${invite.token}`
        try {
            await Mailer.sendInvite(url, req.body.email)
            return res.send("Invite sent.");
        } catch (error) {
            console.log(error)
            return res.status(500).send("Could not send invite.")
        }
    })
})

module.exports = router;
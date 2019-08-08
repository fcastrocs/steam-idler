const express = require('express');
const router = express.Router();
const isLoggedIn = require('./util/isLoggedIn')
const GetAndSaveProxies = require('../util/proxy').GetAndSaveProxies;
const GetAndSaveSteamCMs = require('../util/steamcm').GetAndSaveSteamCMs;
const Proxy = require('../models/proxy');
const SteamCM = require('../models/steamcm')
const sendInvite = require("./util/mailer").sendInvite;
const Invite = require("../models/invite")
const Security = require("../util/security")

router.get(`/admin`, isLoggedIn, (req, res) => {
    if (req.session.admin) {
        Proxy.countDocuments({}, (err, proxyCount) => {
            SteamCM.countDocuments({}, (err, steamcmsCount) => {
                res.render('admin', { proxyCount: proxyCount, steamcmsCount: steamcmsCount })
            });
        });
    } else {
        console.log('access denied')
    }
});

// Renew proxies
router.post(`/admin/renewproxies`, isLoggedIn, (req, res) => {
    if (!req.session.admin) {
        console.log('access denied')
    }

    GetAndSaveProxies();
})

// Renew steamcms
router.post(`/admin/renewsteamcms`, isLoggedIn, (req, res) => {
    if (!req.session.admin) {
        console.log('access denied')
    }

    GetAndSaveSteamCMs();
})


// send invite
router.post(`/admin/sendinvite`, isLoggedIn, (req, res) => {
    if (!req.session.admin) {
        console.log('access denied')
    }

    if(!req.body.email){
        return res.status(400).send("Need email");
    }

    //create new invite
    let invite = new Invite({
        token: Security.createToken()
    })

    invite.save(async (err, doc) =>{
        if(err){
            return res.status(400).send("wtf happened?")
        }
        let url = `http://${req.headers.host}/invite/${invite.token}`
        
        try {
            let result = await sendInvite(url, req.body.email)
            return res.send(result);
        } catch (error) {
            console.log(error)
            return res.status(400).send(error)
        }
    })
})

module.exports = router;
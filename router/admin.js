const express = require('express');
const router = express.Router();
const isLoggedIn = require('./util/isLoggedIn')
const GetAndSaveProxies = require('../util/proxy').GetAndSaveProxies;
const GetAndSaveSteamCMs = require('../util/steamcm').GetAndSaveSteamCMs;
const Proxy = require('../models/proxy');
const SteamCM = require('../models/steamcm')

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

module.exports = router;
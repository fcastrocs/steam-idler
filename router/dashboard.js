const Router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn')
const User = require("../models/user");

// Dashboard
Router.get(`/dashboard/:username`, isLoggedIn, (req, res) => {
    if (req.params.username === req.session.username) {
        res.render('dashboard', {
            username: req.session.username, header: function () {
                return "dashboard-header"
            }
        })
    } else {
        console.log('access denied');
    }
});

/**
 * Change trade url for trade offers
 */
Router.post("/dashboard/changetradeurl", isLoggedIn, async (req, res) => {
    if (!req.body.tradeUrl) {
        return res.status(400).send("tradeurl parameter needed.")
    }
    let regex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=[0-9]+&token=.{8}$/;
    if(!regex.test(req.body.tradeUrl)){
        return res.status(400).send("Invalid trade url.")
    }

    try {
        let user = await User.findOne({ username: req.session.username }).exec();
        user.tradeUrl = req.body.tradeUrl;
        await user.save();
    } catch (err) {
        console.error(err);
        return res.status(500).send("Could not change tradeurl")
    }
    res.send("tradeurl changed");
})

module.exports = Router;

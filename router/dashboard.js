const Router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn')

// Redirect to dashboard if already logged in
Router.get("/", isLoggedIn, (req, res) => {
    res.redirect(`/dashboard/${req.session.username}`);
});

// Dashboard
Router.get(`/dashboard/:username`, isLoggedIn, (req, res) => {
    if (req.params.username === req.session.username) {
        res.render('dashboard', { username: req.session.username })
    } else {
        console.log('access denied');
    }
});

module.exports = Router;
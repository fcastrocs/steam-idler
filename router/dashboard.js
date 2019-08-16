const Router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn')

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

module.exports = Router;

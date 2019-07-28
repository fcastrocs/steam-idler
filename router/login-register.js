const router = require('express').Router();
const User = require('../models/user');
const isLoggedIn = require('./util/isLoggedIn')
const Security = require("../util/security")

let INVCODE = "123"

// Login Page
router.get('/login', isLoggedIn, function(req, res){
    //user is logged in, redirect to dashboard
    res.redirect(`/dashboard/${req.session.username}`);
})

// Login Request
router.post('/login', async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(403).send("You are already logged in.")
    }

    if (!req.body.username || !req.body.password) {
        return res.status(403).send("Bad login request.")
    }

    //usernames should be lowercase
    let username = req.body.username.toLowerCase();

    // find user
    let query = User.findOne({ username: username })
    let doc = await query.exec();
    if (!doc) {
        return res.status(400).send("Bad user/password")
    }

    //compare passwords
    let dbpassword = Security.decrypt(doc.password)
    if (dbpassword !== req.body.password) {
        return res.status(400).send("Bad user/password")
    }

    // Setup session
    req.session.loggedIn = true;
    req.session.username = doc.username;
    req.session.userId = doc._id;
    req.session.admin = doc.admin

    return res.send("Logged in")
})

// Register request
router.post('/register', async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(403).send("You are already logged in.")
    }

    if (!req.body.username || !req.body.password) {
        return res.status(403).send("Bad login request.")
    }

    if (req.body.invcode !== INVCODE) {
        return res.status(403).send("Bad login request.")
    }

    //usernames should be lowercase
    let username = req.body.username.toLowerCase();

    // find user
    let query = User.findOne({ username: username })
    let doc = await query.exec();
    if (doc) {
        return res.status(400).send("User is already registered.")
    }

    //create a new user
    let user = new User({
        username: username,
        password: Security.encrypt(req.body.password)
    });

    // save user
    user.save((err, doc) => {
        //set session
        req.session.loggedIn = true;
        req.session.username = doc.username;
        req.session.userId = doc._id;
        return res.send("Registered")
    })
})

module.exports = router;
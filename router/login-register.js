const router = require('express').Router();
const User = require('../models/user');
const isLoggedIn = require('./util/isLoggedIn')

let INVCODE = "123"

// Login Page
router.get('/login', isLoggedIn, (req, res) => {
    //user is logged in, redirect to dashboard
    res.redirect(`/dashboard/${req.session.username}`);
})

// Login Request
router.post('/login', (req, res) => {
    if(req.session.loggedIn){
        return res.status(403).send({error: 'already loggedin'})
    }

    // find user
    User.findOne({ username: req.body.username }, (err, user) => {
        if (err) throw err;
        
        //user not found
        if(!user) return res.send({error: 'bad user/password'});

        // compare passwords
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (err) throw err;
            // good match
            if (isMatch) {
                req.session.loggedIn = true;
                req.session.username = user.username;
                req.session.userId = user._id;
                req.session.admin = user.admin
                res.send({username: user.username})
            } else { // bad password
                return res.send({error: 'bad user/password'});
            }
        })
    })
})

// Register request
router.post('/register', (req, res) => {
    if(req.session.loggedIn){
        return res.status(403).send({error: 'already registered'})
    }

    if (!req.body.username || !req.body.password || !req.body.invcode) {
        return res.sendStatus(400)
    }

    if (req.body.invcode != INVCODE) {
        return res.status(400).send({ error: 'Invalid invite code' });
    }

    // Check if user already exists
    User.findOne({username: req.body.username}, (err, user) =>{
        if(err) throw err;
        if(user) return res.send({error: 'username already exists'});

        //create a new user
        user = new User({
            username: req.body.username,
            password: req.body.password
        });

        // Save user to database
        user.save((err, savedUser) =>{
            if(err) throw err;
            req.session.loggedIn = true;
            req.session.username = savedUser.username;
            req.session.userId = savedUser._id;
            return res.sendStatus(200);
        })
    })
})

module.exports = router;
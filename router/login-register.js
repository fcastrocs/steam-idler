const router = require('express').Router();
const User = require('../models/user');
const isLoggedIn = require('./util/isLoggedIn')
const Mailer = require("./util/mailer");
const Security = require("../util/security")
const Token = require("../models/token")
const signup = require("./util/signup-schema")
const Invite = require("../models/invite")


// Register request
router.post('/register', async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(403).send("You are already logged in.")
    }

    if (!req.body.username || !req.body.password || !req.body.email ||
        !req.body.invitecode || !req.body.tradeurl) {
        return res.status(403).send("Bad register request.")
    }

    //check invite is valid
    let query = Invite.findOne({token: req.body.invitecode});
    let invite = await query.exec();
    if(!invite){
        return res.status(403).send("Invalid invite code.")
    }


    // trim spaces and make it lower case.
    req.body.username = req.body.username.trim().toLowerCase();


    // trim spaces and make it lower case.
    req.body.email = req.body.email.trim().toLowerCase();


    // validate form data
    signup.validate({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    }, async err => {
        // validation failed
        if (err) {
            let errMsg = "";
            for (let i in err.details) {
                errMsg += err.details[i].message
            }
            return res.status(400).send(errMsg)
        }

        // Make sure the email is not in use
        query = User.findOne({ email: req.body.email });
        let user = await query.exec();
        if (user) {
            return res.status(400).send("This email is already in use.")
        }

        // Make sure the username does not exist
        query = User.findOne({ username: req.body.username });
        user = await query.exec();
        if (user) {
            return res.status(400).send("This username already exists.")
        }

        // create the user
        user = new User({
            username: req.body.username,
            password: Security.encrypt(req.body.password),
            email: req.body.email
        })

        // save the user
        user.save(async (err, doc) => {
            if (err) {
                return res.status(400).send("Unexpected error occurred. Code: 1")
            }

            //delete the invite
            invite.remove();

            try {
                let result = await createToken_SendVerification(doc, req.headers.host);
                // delete the invite code.
                return res.send(result);
            } catch (error) {
                return res.status(400).send(error);
            }
        })
    })
})


router.get('/invite/:token', async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(403).send("You are already logged in.")
    }

    //find invite
    res.render('login-register', { invite: req.params.token })
})

router.get('/confirmation/:token', async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(403).send("You are already logged in.")
    }

    // find token
    let query = Token.findOne({ token: req.params.token });
    let token = await query.exec();
    // token not found
    if (!token) {
        return res.status(403).send("Invalid token or expired.")
    }

    // find user
    query = User.findOne({ _id: token.userId })
    let user = await query.exec();
    if (!user) {
        return res.status(403).send("No user found for this token.")
    }

    if (user.isVerified) {
        return res.status(403).send("User has already been verified.")
    }

    // Verify and save user
    user.isVerified = true;
    user.save((err, doc) => {
        if (err) {
            return res.status(400).send("Unexpected error occurred. Code: 3")
        }

        res.render('login-register', { message: "Your account has been verified, please log in." })
    })
})


// Login Page
router.get('/login', isLoggedIn, function (req, res) {
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
    let username = req.body.username.trim().toLowerCase();

    // find user
    let query = User.findOne({ username: username })
    let doc = await query.exec();
    if (!doc) {
        return res.status(400).send("Bad user/password.")
    }

    //compare passwords
    let dbpassword = Security.decrypt(doc.password)
    if (dbpassword !== req.body.password) {
        return res.status(400).send("Bad user/password.")
    }

    // make sure user is verified. create new token and send verification
    if (!doc.isVerified) {
        try {
            let result = await createToken_SendVerification(doc, req.headers.host);
            return res.status(400).send(result);
        } catch (error) {
            return res.status(400).send(error);
        }
    }

    // Setup session
    req.session.loggedIn = true;
    req.session.username = doc.username;
    req.session.userId = doc._id;
    req.session.admin = doc.admin

    return res.send("Logged in")
})

async function createToken_SendVerification(doc, host) {
    return new Promise(async (resolve, reject) => {
        // check if there's a token
        let query = Token.findOne({ userId: doc._id });
        let token = await query.exec();

        // Token not found
        if (!token) {
            token = new Token({ userId: doc._id, token: Security.createToken() });
        } else {
            //token found, update token and creation date
            token.token = Security.createToken();
            token.createdAt = Date.now();
        }

        // save the token
        token.save(async (err) => {
            if (err) {
                return reject("Unexpected error occurred. Code: 2")
            }
            let url = `http://${host}/confirmation/${token.token}`
            try {
                await Mailer.sendVerification(url, doc.username, doc.email);
                return resolve(`A confirmation email has been sent to ${doc.email}. Check junk folder.`)
            } catch (error) {
                return reject(`Could not send verification email`)
            }
        });
    })
}



module.exports = router;
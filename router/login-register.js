const router = require('express').Router();
const User = require('../models/user');
const Mailer = require("../mailer");
const Security = require("../util/security")
const Token = require("../models/token")
const signup = require("./util/signup-schema")
const Invite = require("../models/invite")
const mongoose = require('mongoose');

router.post('/login', async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(400).send("You are already logged in.")
    }

    if (!req.body.username || !req.body.password) {
        return res.status(400).send("username/password needed")
    }

    //usernames should be lowercase
    let username = req.body.username.trim().toLowerCase();

    // find user
    let query = User.findOne({ username: username })
    let doc = await query.exec();
    if (!doc) {
        return res.status(400).send("Bad username/password.")
    }

    //compare passwords
    let dbpassword = Security.decrypt(doc.password)
    if (dbpassword !== req.body.password) {
        return res.status(400).send("Bad username/password.")
    }

    // make sure user is verified.
    if (!doc.isVerified) {
        try {
            return res.send(await createToken_sendConfirmation(doc, req.headers.host))
        } catch (error) {
            return res.status(500).send(error);
        }
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
        return res.status(400).send("You are already logged in.")
    }

    if (!req.body.username || !req.body.password || !req.body.email ||
        !req.body.invitecode || !req.body.tradeurl || !req.body.password2) {
        return res.status(400).send("Bad register request.")
    }

    //check invite is valid
    let query = Invite.findOne({ token: req.body.invitecode });
    let invite = await query.exec();
    if (!invite) {
        return res.status(400).send("Invalid invite code.")
    }

    if (req.body.password2 !== req.body.password) {
        return res.status(400).send("Passwords do not math.")
    }

    // trim spaces and make it lower case.
    req.body.username = req.body.username.trim().toLowerCase();
    // trim spaces and make it lower case.
    req.body.email = req.body.email.trim().toLowerCase();

    // validate form data
    let valRes = signup.validate({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    })

    if (valRes.error) {
        let errMsg = valRes.error.details[0].message
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
        _id: mongoose.Types.ObjectId(),
        username: req.body.username,
        password: Security.encrypt(req.body.password),
        email: req.body.email
    })

    try {
        await createToken_sendConfirmation(user, req.headers.host);
        await invite.remove();
        await user.save();
        let text = `An email has been sent to ${user.email} to confirm your account.\n`
            + "If you don't receive an email, login and another email will be sent."
        return res.send(text);
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
})

router.get('/register/confirm/:token', async function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/");
    }

    // find token
    let query = Token.findOne({ token: req.params.token });
    let token = await query.exec();
    // token not found
    if (!token) {
        return res.redirect("/");
    }

    // find user linked to token
    query = User.findOne({ _id: token.userId })
    let user = await query.exec();
    if (!user) { //this shouldn't happen, but check anyways
        return res.redirect("/");
    }

    // Verify user
    user.isVerified = true;

    try {
        // save user
        await user.save();
        // delete token
        await token.remove();
        req.session.registerConfirm = {
            message: "Your account has been confirmed, please log in."
        }
        return res.redirect("/")
    } catch (error) {
        return res.status(400).send("Unexpected error occurred. Code: 4")
    }
})


router.get("/logout", async function (req, res) {
    if (!req.session.loggedIn) {
        return res.redirect("/")
    }
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Unexpected error occurred. Code: 5");
        }
        res.redirect("/")
    });
})

/***************************************************
 *              ACCOUNT RECOVERY                   *
 **************************************************/

// Generate a recovery link
router.post("/recovery", async function (req, res) {
    if (req.session.loggedIn) {
        return res.status(400).send("You are already logged in.")
    }

    if (!req.body.recoverEmail) {
        return res.status(400).send("Need recovery email.")
    }

    // find user with this email
    let query = User.findOne({ email: req.body.recoverEmail });
    let user = await query.exec();
    // user not found
    if (!user) {
        return res.status(400).send("A user with this email was not found.")
    }

    //user found, create token
    user.passwordResetToken = Security.createToken();
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000

    user.save(async (err, doc) => {
        if (err) {
            return res.status(500).send("Unexpected error occurred. Code: 6")
        }

        //send recovery link
        let url = `https://${req.headers.host}/recovery/${doc.username}/${doc.passwordResetToken}`

        try {
            return res.send(await Mailer.sendRecovery(url, doc.email));
        } catch (error) {
            return res.status(500).send(error);
        }
    })
})

// Recover link redirect to change password
router.get("/recovery/:user/:token", async function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/")
    }

    req.session.passwordReset = {
        recoverUser: req.params.user,
        recoverToken: req.params.token
    }

    // send to change password form
    res.redirect("/");
})


router.post("/recovery/changepass", function (req, res) {
    if (req.session.loggedIn) {
        return res.status(403).send("You are already logged in.")
    }

    if (!req.body.recoverUsername || !req.body.recoverPassword || !req.body.recoverPassword2
        || !req.body.recoverToken) {
        return res.status(403).send("Bad changepassword request.")
    }

    // compare passwords
    if (req.body.recoverPassword !== req.body.recoverPassword2) {
        return res.status(403).send("Passwords do not math.")
    }

    signup.validate({
        password: req.body.recoverPassword
    }, async err => {
        // validation failed
        if (err) {
            let errMsg = "";
            for (let i in err.details) {
                errMsg += err.details[i].message
            }
            return res.status(400).send(errMsg)
        }

        //validation passed

        // find user
        let query = User.findOne({
            username: req.body.recoverUsername,
            passwordResetToken: req.body.recoverToken
        })

        let user = await query.exec();
        if (!user) {
            return res.status(403).send("Invalid token or bad username.")
        }

        //user found
        //check token validity
        let expiryDate = new Date(user.passwordResetExpires).getTime()
        if (expiryDate < Date.now()) {
            return res.status(403).send("Expired Token.")
        }

        // valid token
        // remove token
        user.passwordResetToken = ""
        // change password 
        user.password = Security.encrypt(req.body.recoverPassword)

        // save user
        user.save((err, doc) => {
            if (err) {
                return res.status(403).send("Unexpected error occurred. Code: 5")
            }

            // Redirect to login page
            res.send("/login/?message=You+password+has+been+changed%2F")
        })
    })
})

// invite link redirect to registration form
router.get('/invite/:token', async function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/")
    }
    req.session.invite = {
        token: req.params.token
    }
    res.redirect("/")
})

// Creates or updates email confirmation token, sends email to user.
async function createToken_sendConfirmation(doc, host) {
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

        // save token
        try {
            await token.save();
        } catch (error) {
            return reject("Unexpected error occurred. Code: 2")
        }

        try {
            let url = `https://${host}/register/confirm/${token.token}`
            await Mailer.sendEmailConfirm(url, doc.email);
            return resolve()
        } catch (error) {
            return reject("Unexpected error occurred. Code: 3")
        }
    })
}


module.exports = router;
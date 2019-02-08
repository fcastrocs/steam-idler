const router = require('express').Router();
const isLoggedIn = require('./util/isLoggedIn');
const SteamAccounts = require('../models/steam-accounts')
const AccountHandler = require('../farmer/account-handler');

// Returns all accounts for this user
router.get('/steamaccounts', isLoggedIn, (req, res) =>{
    SteamAccounts.find({userId: req.session.userId}, 'user', (err, accounts) => {
        if(err) throw err;
        if(!accounts) return res.send(null);
        res.send(accounts)
    })
})

// Adds a new steam account to the collection
router.post('/steamaccounts', isLoggedIn, (req,res) =>{
    if(!req.body.user || !req.body.pass){
        return res.status(400).send({error: 'bad request'})
    }

    //check if account is already in database
    SteamAccounts.findOne({
        userId: req.session.userId, 
        user: req.body.user
    }, (err, doc) =>{
        if(err) throw err;
        //account already in database
        if(doc) return res.send({error: "You've already added this account"})

        //Create an account handler before saving
        // to do...
        
        //save account
        let account = new SteamAccounts({
            userId: req.session.userId,
            user: req.body.user,
            pass: req.body.pass
        })

        account.save(err =>{
            if(err) throw err;
            //res.status(200).send('account added');
            let accounthandler = new AccountHandler(account.user, account.pass);
            //accounthandler.Connect();

        })
    })
})

// Removes a steam account
router.delete('/steamaccounts/:user', isLoggedIn, (req, res) =>{
    SteamAccounts.findOneAndDelete({userId: req.session.userId, user: req.params.user}, (doc) =>{
        if(!doc) return res.status(400).send({error: 'forbidden'})

        //Terminate account handler
        //to do... 
        
        res.status(200).send('okay')
    })
})

module.exports = router;
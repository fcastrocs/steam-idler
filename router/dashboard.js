const express = require('express');
const router = express.Router();
const isLoggedIn = require('./util/isLoggedIn')


// dashboard
router.get("/", isLoggedIn, (req, res) => {
    res.redirect(`/dashboard/${req.session.username}`);
});

router.get(`/dashboard/:username`, (req, res) =>{
    if(req.params.username === req.session.username){
        res.render('dashboard', {username: req.session.username})
    }else{
        console.log('access denied')
    }
});

module.exports = router;
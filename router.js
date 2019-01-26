const express = require('express');
const router = express.Router();

//models

// Main page
router.get("/", isLoggedIn, (req, res) => {
    res.render('index');
});


router.post("/account/add", (req, res) => {
    console.log(req.params)
})

router.delete('/account/del', (req, res) => {
    console.log('deleting account')
})

router.post("/account/cdkey", (req, res) => {
    console.log('reqest')
})

module.exports = router;
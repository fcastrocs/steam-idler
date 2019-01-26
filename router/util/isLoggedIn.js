module.exports = function isLoggedIn(req, res, next) {
    console.log('here')
    if (req.session.loggedIn)
        return next();
    res.render('login-register');
}
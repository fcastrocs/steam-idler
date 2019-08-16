module.exports = function isLoggedIn(req, res, next) {
    if(req.session.loggedIn){
        return next();
    }
    res.redirect("/");
}
module.exports = (req, res, next) => {
    if (req.session.admin) {
        return next();
    }
    return res.status(403).send();
}

const ApiLimiter = require("../../models/api-limiter")


// Check whether user has an ongoin request
// Creates one if one is not found
module.exports.checker = async (req, res, next) => {
    try {
        let result = await ApiLimiter.findOne({ userId: req.session.userId })
        if (result) {
            return res.status(400).send("You have an ongoing request, wait until it finishes.")
        }

        // Create an api limiter
        let apiLimiter = new ApiLimiter({
            userId: req.session.userId
        })
        apiLimiter.save(err => {
            if (err) {
                console.log(err);
            }
        });

        return next();
    } catch (error) {
        console.log(error);
        return res.status(500).send("Something went wrong while tring to fetch api limiter.")
    }
}

module.exports.remove = userId => {
    ApiLimiter.findOneAndDelete({ userId: userId }, (err) => {
        if (err) {
            console.log(err);
        }
    })
}

const ApiLimiter = require("../../models/api-limiter")

/**
 * Middleware for API limiter creator, checks if user is logged in first.
 */
module.exports = async function (req, res, next) {
    if (!req.session.loggedIn) {
        return res.redirect("/");
    }

    // create api limiter
    try {
        await create(req.session.userId);
    } catch (err) {
        return res.status(500).send(err);
    }

    let send = res.send;
    res.send = function (body) {
        // This will prevent res.send() from executing twice, because res.send is called twice
        if (typeof (body) === 'string' && !res.dontRemoveApiLimit) {
            remove(req.session.userId);
        }
        send.call(this, body);
    }

    next();
}

/**
 * Create an API limiter
 */
async function create(userId) {
    try {
        let result = await ApiLimiter.findOne({ userId: userId })
        // There is already an ongoing limiter
        if (result) {
            // set flag so the limiter is not removed by this send()
            return Promise.reject("You have an ongoing request, wait until it finishes.")
        }

        // Create api limiter
        let apiLimiter = new ApiLimiter({
            userId: userId
        })

        await apiLimiter.save();
        return Promise.resolve();
    } catch (error) {
        console.error(error);
        return Promise.resolve("Could not create API limiter.");
    }
}

/**
 * Remove API limiter
 */
function remove(userId) {
    setTimeout(async () => {
        try {
            await ApiLimiter.findOneAndDelete({ userId: userId }).exec();
        } catch (err) {
            console.error(err);
        }
    }, 1000);
}
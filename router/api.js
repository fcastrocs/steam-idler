const Router = require('express').Router();
const Accounts = require("../models/steam-accounts");

Router.get("/api/idledhours", async (req, res) => {
    let doc = await Accounts.aggregate([
        { $match: { idledSeconds: { $gte: 1 } } },
        { $group: { _id: null, amount: { $sum: "$idledSeconds" } } }
    ]).exec();

    if (!doc) {
        res.send("0");
    } else {
        res.send(`${Math.round(doc[0].amount / 3600)}`);
    }
})

Router.get("/api/steamaccscount", async (req, res) => {
    let count = await Accounts.countDocuments({}).exec();
    res.send(`${count}`);
})

module.exports = Router;


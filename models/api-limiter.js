const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let apiLimiter = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    createdAt: { type: Date, default: Date.now, expires: "10m" }
});

module.exports = mongoose.model('api-limiter', apiLimiter);
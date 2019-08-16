const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let apiLimiter = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"}
});

module.exports = mongoose.model('api-limiter', apiLimiter);
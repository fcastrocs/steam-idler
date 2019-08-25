const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let token = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    token: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, expires: "3h"} 
});

module.exports = mongoose.model('Token', token);
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let steamcm = new Schema({
    ip: {type: String, required: true},
    port: {type: Number, required: true}
});

module.exports = mongoose.model('SteamCM', steamcm);
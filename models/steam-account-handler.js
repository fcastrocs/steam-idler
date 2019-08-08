const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let steamAccHandler = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User' , required: true},
    accountId: {type: Schema.Types.ObjectId, ref: 'SteamAccount', unique: true, required: true}
});

module.exports = mongoose.model('steam-accounthandler', steamAccHandler);
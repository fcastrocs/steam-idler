const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let steamAccHandler = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User' , required: true},
    accountIds: [{ type : Schema.Types.ObjectId, ref: 'SteamAccount' }]
});

module.exports = mongoose.model('steamacc-handler', steamAccHandler);
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let steamAcc = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User' , required: true},
    user: {type: String, required: true, unique: true},
    pass: {type: String, required: true, minlength: 1}
});

module.exports = mongoose.model('SteamAccount', steamAcc);
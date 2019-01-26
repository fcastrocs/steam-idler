const Schema = require('mongoose').Schema;

let steamAcc = new Schema({
    user: {type: String, required: true, unique: true},
    pass: {type: String, required: true, minlength: 1}
});

module.exports = mongoose.model('SteamAccount', steamAcc);
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let user = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: Object, required: true },
    email: {type: String, unique: true, required: true},
    passwordResetToken: {type: String},
    passwordResetExpires: {type: Date},
    isVerified: {type: Boolean, default: false},
    admin: {type: Boolean, default: false}
});

module.exports = mongoose.model('User', user);
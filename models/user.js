const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let user = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: Object, required: true },
    admin: {type: Boolean, default: false}
});

module.exports = mongoose.model('User', user);
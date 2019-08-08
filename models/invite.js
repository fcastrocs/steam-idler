const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let invite = new Schema({
    token: {type: String, required: true},
    createdAt: {type: Date, required: true, default: Date.now, expires: 43200} 
});

module.exports = mongoose.model('Invite', invite);
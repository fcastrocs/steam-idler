const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let proxy = new Schema({
    ip: {type: String, required: true},
    port: {type: Number, required: true}
});

module.exports = mongoose.model('Proxy', proxy);
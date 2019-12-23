const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let steamAcc = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User' , required: true},
    user: {type: String, required: true, unique: true},
    pass: {type: Object, required: true},
    shared_secret: {type: Object, default: null},
    sentry: {type: Object, default: null},
    games: {type: Array, default: null},
    status: {type: String, required: true},
    forcedStatus: {type: String, required: true},
    steamid: {type: String, required: true},
    gamesPlaying: {type: Array, default: []},
    farmingGames: {type: Array, default: []},
    persona_name: {type: String, required: true},
    avatar: {type: String, required: true},
    farmingData: {type: Array, default: []},
    isFarming: {type: Boolean, default: false},
    nextFarmingCheck: {type: Number, default: 0},
    inventory: {type: Array, default: []},
    lastConnect: {type: Number, default: 0},
    lastHourReconnects: {type: Number, default: 0},
    privacySettings: {type: Object, default: null},
    idledSeconds: {type: Number, default: 0}
});

module.exports = mongoose.model('SteamAccount', steamAcc);
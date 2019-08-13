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
    gamesPlaying: [{ type: Object, default: [] }],
    farmingGames: [{ type: Object, default: [] }],
    persona_name: {type: String, required: true},
    avatar: {type: String, required: true},
    farmingData: [{ type: Object, default: []}],
    isFarming: {type: Boolean, default: false},
    nextFarmingCheck: {type: Number, default: 0},
    inventory: {type: Object, default: null}
});

module.exports = mongoose.model('SteamAccount', steamAcc);
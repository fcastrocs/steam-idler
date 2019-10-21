const Long = require("bytebuffer").Long;

class SteamID {
  constructor(object) {
    this.accountID = object.accountID || 0;
    this.accountInstance = object.accountInstance || 0;
    this.accountType = object.accountType || 0;
    this.accountUniverse = object.accountUniverse || 0;
  }

  encode() {
    return new Long(this.accountID, this.accountInstance | this.accountType << 20 | this.accountUniverse << 24);
  }

  toString() {
    return this.encode().toString();
  }

  static decode(steamID) {
    steamID = Long.fromValue(steamID);
    return new SteamID({
      accountID: steamID.low,
      accountInstance: steamID.high & 0xFFFFF,
      accountType: steamID.high >> 20 & 0xF,
      accountUniverse: steamID.high >> 24 & 0xFF
    });
  }
  
}

module.exports = SteamID;
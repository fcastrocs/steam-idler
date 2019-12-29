const Long = require("bytebuffer").Long;

/**
 * Returns a 64-bit SteamID
 */
module.exports = function (accountId) {
  if (!accountId) {
    accountId = 0;
  }

  let parsedId = parseInt(accountId, 10);

  // use default values
  let instance = 1;
  let type = 1;
  let universe = 1;

  let long = new Long(parsedId, instance | type << 20 | universe << 24);
  return long.toString();
}
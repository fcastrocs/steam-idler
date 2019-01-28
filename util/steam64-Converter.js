const BigNumber = require('bignumber.js')

module.exports = Steam64toLegacy = (steamId64) =>{
    let base = BigNumber('76561197960265728');
    let input = BigNumber(steamId64);
    
    let y = 0;

    if(input.mod(2).toPrecision(1) === '1'){
        y = 1;
    }

    let accountId = input
        .minus(y)
        .minus(base)
        .div(2)
        .toPrecision(17);

    accountId = parseInt(accountId, 10);

    let steamId = [];
    steamId[0] = `STEAM_0:${y}:`
    steamId[1] = accountId.toString();
    return steamId;
}
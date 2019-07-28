const request = require("request-promise-native")
const SteamCrypto = require('./farmer/steam/node_modules/@doctormckay/steam-crypto');

const Crypto = require('crypto');

let sessionKey = SteamCrypto.generateSessionKey();
let encryptedNonce = SteamCrypto.symmetricEncryptWithHmacIv("gncqlircrFC4KvrA+VY", sessionKey.plain);

let data = {
	"steamid": "76561197964552011",
	"sessionkey": sessionKey.encrypted,
	"encrypted_loginkey": encryptedNonce
};


let options = {
	url: `https://api.steampowered.com/ISteamUserAuth/AuthenticateUser/v1`,
	method: 'POST',
	formData: data,
	json: true
}

/*request(options).then(res=>{
	cookie.sessionid = Crypto.randomBytes(12).toString('hex');
	cookie.steamLogin = res.authenticateuser.token
	cookie.steamLoginSecur = res.authenticateuser.tokensecure

	console.log(cookie)
}).catch(err=>{
    console.log(err)
})*/

let cookie = "sessionid=ced2cf903f2af92e2259b012; steamLogin=76561197964552011%7c%7c95AF89CDDDDAA7FB2EDE33745965FDA6AD0C6084; steamLoginSecure=76561197964552011%7c%7cF94E2977E3317997B59D8A9C2FEBF344608DFBEA;"

options = {
	url: "https://steamcommunity.com/profiles/76561197964552011/badges",
	headers: {
		Cookie: cookie
	},
	method: "get"
}

request(options).then(res =>{
	console.log(res)
})
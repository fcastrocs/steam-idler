"use strict";

const ByteBuffer = require('bytebuffer');
const EventEmitter = require('events').EventEmitter;
const Steam = require('./steam-resources');
const Connection = require("./connection");
const SteamID = require('./steamID');
const BufferCRC32 = require('buffer-crc32');
const SteamCrypto = require('@doctormckay/steam-crypto');
const BinaryKVParser = require('binarykvparser');
const VDF = require('vdf');

class SteamClient extends EventEmitter {
	constructor(options) {
		super();

		let self = this;
		this.PROTO_MASK = 0x80000000;
		this.PROTOCOL_VERSION = 65575;
		this._jobs = {};
		this._currentJobID = 0;
		this.sessionID = 0;

		this.Schema = Steam.Internal;
		this.EMsg = Steam.EMsg;

		this.packages = new Array();
		this.apps = new Array();

		//create connection object, need to call connect method.
		this._connection = new Connection(options);

		// Errors while connection is active
		this._connection.once("error", err => {
			clearInterval(self._heartBeatFunc)
			self.emit("error", err);
		})

		this._connection.on('packet', function (packet) {
			self.NetMsgReceived(packet);
		});
	}

	Connect() {
		return this._connection.Connect();
	}

	/************************************************************************
	 * 							 RESPONSE HANDLER							*
	 ************************************************************************/
	ResponseHandler(msg, body) {
		let self = this;
		/************************************************************************
		 * 							LOGIN RESPONSE								*
		 ************************************************************************/
		if (msg == this.EMsg.ClientLogOnResponse) {
			var logonResp = this.Schema.CMsgClientLogonResponse.decode(body);
			var eresult = logonResp.eresult;

			// Account logged in successfully
			if (eresult == Steam.EResult.OK) {
				var hbDelay = (logonResp.out_of_game_heartbeat_seconds - 2) * 1000;

				this._connection.socket.setTimeout(hbDelay + 5000);

				// Establish a heartbeat so we don't get disconnected
				// before we get vac, limited, email verification info
				this._heartBeatFunc = setInterval(function () {
					self.Send({
						"msg": self.EMsg.ClientHeartBeat,
						"proto": {}
					}, new self.Schema.CMsgClientHeartBeat().toBuffer());

				}, hbDelay);
			}

			this.emit('logOnResponse', this.ProcessProto(logonResp));
		}

		/************************************************************************
		 * 							LICENCES RESPONSE							*
		 ************************************************************************/
		else if (msg == this.EMsg.ClientLicenseList) {
			body = this.Schema.CMsgClientLicenseList.decode(body);

			//Filter out the default steam package
			let packageids = body.licenses.filter((license) => {
				if (license.package_id == 0) {
					return false;
				} else {
					return true;
				}
			}).map(function (license) {
				return license.package_id;
			});
			packageids.sort(self.SortNumeric);


			self.GetPkgInfo(packageids, appIds => {
				self.GetAppInfo(appIds, games => {
					self.emit("games", games);
				})
			})
		}

		/************************************************************************
		 * 					  ACCOUNT INFO: persona name						*
		 ************************************************************************/
		else if (msg == this.EMsg.ClientAccountInfo) {
			body = this.Schema.CMsgClientAccountInfo.decode(body);
			this.emit("persona-name", body.persona_name)
		}
		/************************************************************************
		 * 					  PERSONA STATA: avatar url							*
		 ************************************************************************/
		else if (msg == this.EMsg.ClientPersonaState) { //get avatar url
			//For some reason this is called twice.
			//only exectue once
			if (this.persona_state) {
				return;
			}
			this.persona_state = true;
			body = this.Schema.CMsgClientPersonaState.decode(body);

			// get url from hash
			let hash = body.friends[0].avatar_hash.toString('hex')
			let tag = hash.substring(0, 2);
			let url = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars"
			if (hash == "0000000000000000000000000000000000000000") { //return default avatar
				url = `${url}/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`
			} else {
				url = `${url}/${tag}/${hash}_full.jpg`
			}

			this.emit("avatar", url)
		}

		/************************************************************************
		 * 					  ACTIVATE F2P GAMES RESPONSE  					    *
		 ************************************************************************/
		else if (msg == this.EMsg.ClientRequestFreeLicenseResponse) {
			body = this.Schema.CMsgClientRequestFreeLicenseResponse.decode(body)
			this.GetAppInfo(body.granted_appids, games => {
				this.emit("activated-f2p-games", games)
			})
		}

		/************************************************************************
		 * 					  REDEEEM CD-KEY RESPONSE							*
		 ************************************************************************/
		else if (msg == this.EMsg.ClientPurchaseResponse) {
			body = this.Schema.CMsgClientPurchaseResponse.decode(body)
			let receipt = BinaryKVParser.parse(body.purchase_receipt_info).MessageObject
			if (receipt.ResultDetail == 0 && receipt.LineItemCount && receipt.LineItemCount > 0) {
				let pkgIds = []
				receipt.lineitems.forEach(item => {
					let packageID = item.PackageID || item.packageID || item.packageid;
					pkgIds.push(packageID)
				})

				this.GetPkgInfo(pkgIds, appIds => {
					self.GetAppInfo(appIds, games => {
						self.emit("redeem-key", games);
					})
				})
			} else {
				let msg = ""
				if (receipt.ResultDetail == 9) {
					msg = "You already have this game."
				} else if (receipt.ResultDetail == 13) {
					msg = "CD-KEY is region locked."
				} else if (receipt.ResultDetail == 14) {
					msg = "Bad CD-KEY."
				} else if (receipt.ResultDetail == 15) {
					msg = "CD-KEY is already redeemed."
				} else if (receipt.ResultDetail == 24) {
					msg = "Base game required."
				} else {
					msg = "Something went wrong."
				}
				self.emit("redeem-key", msg);
			}
		} else if (msg == this.EMsg.ChannelEncryptRequest) {
			this.ChannelEncryptRequest(body);
		}
		else if (msg == this.EMsg.ChannelEncryptResult) {
			this.ChannelEncryptResult(body);
		}
		else if (msg == this.EMsg.Multi) {
			this.Multi(body);
		}

		/************************************************************************
		 * 							LOGIN KEY									*
		 ************************************************************************/
		/*else if (msg == this.EMsg.ClientNewLoginKey) { //accept loginkey
			let newLoginKey = this.Schema.CMsgClientNewLoginKey.decode(body);
			
			this.Send({
				msg: this.EMsg.ClientNewLoginKeyAccepted,
				proto: {}
			}, new this.Schema.CMsgClientNewLoginKeyAccepted({ unique_id: newLoginKey.unique_id }).toBuffer());
	
			this.emit('loginKey', newLoginKey.login_key);
		}*/
	}


	setPersona(state, name) {
		this._personaState = state;
		this.Send({
			msg: this.EMsg.ClientChangeStatus, proto: {}
		}, new this.Schema.CMsgClientChangeStatus({
			persona_state: state,
			player_name: name
		}).toBuffer());
	}

	playGames(games) {
		this.Send({
			msg: this.EMsg.ClientGamesPlayed,
			proto: {}
		}, new this.Schema.CMsgClientGamesPlayed({ games_played: games }).toBuffer());
	}


	activateF2pGames(appIds) {
		this.Send({
			msg: this.EMsg.ClientRequestFreeLicense,
			proto: {}
		}, new this.Schema.CMsgClientRequestFreeLicense(appIds).toBuffer());
	}

	redeemKey(cdkey) {
		this.Send({
			msg: this.EMsg.ClientRegisterKey,
			proto: {}
		}, new this.Schema.CMsgClientRegisterKey({ key: cdkey }).toBuffer());
	}

	LogOn(logOnDetails) {
		// Get temporary SteamID
		this.steamID = SteamID();

		logOnDetails.protocol_version = this.PROTOCOL_VERSION;
		this.Send({
			msg: this.EMsg.ClientLogon,
			proto: {}
		}, new this.Schema.CMsgClientLogon(logOnDetails).toBuffer());
	}

	ClientUpdateMachineAuth(body, callback) {
		let self = this;
		let machineAuth = this.Schema.CMsgClientUpdateMachineAuth.decode(body);
		this.emit('updateMachineAuth', this.ProcessProto(machineAuth), function (response) {
			callback({
				msg: self.EMsg.ClientUpdateMachineAuthResponse,
				proto: {}
			}, new self.Schema.CMsgClientUpdateMachineAuthResponse(response).toBuffer());
		});
	}


	/************************************************************************
 	* 					  RETURNS ARRAY OF APPIDS							*
 	************************************************************************/
	GetPkgInfo(pkgIds, callback) {
		if (pkgIds == null || pkgIds.length < 1) {
			callback([]);
			return;
		}

		this.GetProductInfo([], pkgIds, function (apps, packages) {
			// Request info for all the apps in these packages
			let appids = [];
			for (let pkgid in packages) {
				// This package has expired. Free weekend, usually
				var extended = packages[pkgid].packageinfo.extended;
				if (extended && extended.expirytime && extended.expirytime <= Math.floor(Date.now() / 1000)) {
					continue;
				}

				packages[pkgid].packageinfo.appids.forEach((appid) => {
					appids.push(appid);
				})
			}
			callback(appids)
		});
	}


	/************************************************************************
 	* 			  RETURNS ARRAY APP INFO [{appid, name, logo}]				*
 	************************************************************************/
	GetAppInfo(appids, callback) {
		if (appids == null || appids.length < 1) {
			callback([]);
			return;
		}

		//bug? this function returns twice with the same info.
		//proceeded after the first return
		let returnCount = 0
		this.GetProductInfo(appids, [], function (apps) {
			returnCount++;
			if (returnCount > 1) {
				return;
			}

			let appInfo = [];

			for (var id in apps) {
				if (!apps[id].appinfo || !apps[id].appinfo.common || !apps[id].appinfo.common.type) {
					continue;
				}
				var type = apps[id].appinfo.common.type.toLowerCase();
				if (type != 'game') {
					continue
				}

				appInfo.push(apps[id]);
			}

			let games = []
			for (let i in appInfo) {
				let game = {
					appId: appInfo[i].appinfo.common.gameid,
					name: appInfo[i].appinfo.common.name,
					logo: appInfo[i].appinfo.common.logo
				}
				games.push(game);
			}

			// no games
			if (games.length < 1) {
				games = null;
			}
			callback(games)
		});
	}

	NetMsgReceived(data) {
		var rawEMsg = data.readUInt32LE(0);
		var eMsg = rawEMsg & ~this.PROTO_MASK;

		data = ByteBuffer.wrap(data, ByteBuffer.LITTLE_ENDIAN);

		var header, sourceJobID, targetJobID;
		if (eMsg == this.EMsg.ChannelEncryptRequest || eMsg == this.EMsg.ChannelEncryptResult) {
			header = this.Schema.MsgHdr.decode(data);
			sourceJobID = header.sourceJobID;
			targetJobID = header.targetJobID;

		} else if (rawEMsg & this.PROTO_MASK) {
			header = this.Schema.MsgHdrProtoBuf.decode(data);
			header.proto = this.ProcessProto(header.proto);
			if (!this.sessionID && header.headerLength > 0) {
				this.sessionID = header.proto.client_sessionid;
				this.steamID = header.proto.steamid;
			}
			sourceJobID = header.proto.jobid_source;
			targetJobID = header.proto.jobid_target;

		} else {
			header = this.Schema.ExtendedClientMsgHdr.decode(data);
			sourceJobID = header.sourceJobID;
			targetJobID = header.targetJobID;
		}

		var body = data.toBuffer();

		this.ResponseHandler(eMsg, body);

		if (sourceJobID != '18446744073709551615') {
			var callback = function (header, body, callback) {
				if (header.proto)
					header.proto.jobid_target = sourceJobID;
				else
					header.targetJobID = sourceJobID;
				this._Send(header, body, callback);
			}.bind(this);
		}

		if (targetJobID in this._jobs) {
			this._jobs[targetJobID](header, body, callback);
		}
		else {
			//this.emit('message', header, body, callback);
			if (eMsg == this.EMsg.ClientUpdateMachineAuth) {
				this.ClientUpdateMachineAuth(body, callback)
			}
		}
	}

	_Send(header, body, callback) {
		if (callback) {
			var sourceJobID = ++this._currentJobID;
			this._jobs[sourceJobID] = callback;
		}

		if (header.msg == this.EMsg.ChannelEncryptResponse) {
			header.sourceJobID = sourceJobID;
			header = new this.Schema.MsgHdr(header);

		} else if (header.proto) {
			header.proto.client_sessionid = this.sessionID;
			header.proto.steamid = this.steamID;
			header.proto.jobid_source = sourceJobID;
			header = new this.Schema.MsgHdrProtoBuf(header);

		} else {
			header.steamID = this.steamID;
			header.sessionID = this.sessionID;
			header.sourceJobID = sourceJobID;
			header = new this.Schema.ExtendedClientMsgHdr(header);
		}

		this._connection.Send(Buffer.concat([header.toBuffer(), body]));
	}

	Send(header, body, callback) {
		// ignore any target job ID
		if (header.proto) {
			delete header.proto.jobid_target;
		} else {
			delete header.targetJobID;
		}

		if (ByteBuffer.isByteBuffer(body)) {
			body = body.toBuffer();
		}

		this._Send(header, body, callback);
	}

	Multi(data) {
		var msgMulti = this.Schema.CMsgMulti.decode(data);
		var payload = msgMulti.message_body.toBuffer();

		if (msgMulti.size_unzipped) {
			var zip = new (require('adm-zip'))(payload);
			payload = zip.readFile('z');
		}

		// stop handling if user disconnected
		while (payload.length && this.connected) {
			var subSize = payload.readUInt32LE(0);
			this.NetMsgReceived(payload.slice(4, 4 + subSize));
			payload = payload.slice(4 + subSize);
		}
	}

	ChannelEncryptResult(data) {
		var encResult = this.Schema.MsgChannelEncryptResult.decode(data);

		if (encResult.result == Steam.EResult.OK) {
			this._connection.sessionKey = this._tempSessionKey;
			this._connection.useHmac = this._tempUseHmac;
		} else {
			this.emit('error', new Error("Encryption fail: " + encResult.result));
			return;
		}

		this.connected = true;
		this.emit('connected');
	}

	ChannelEncryptRequest(data) {
		var buffer = ByteBuffer.wrap(data, ByteBuffer.LITTLE_ENDIAN);
		buffer.readUint32(); // protocol
		buffer.readUint32(); // universe
		var nonce = null;

		if (buffer.remaining() >= 16) {
			nonce = buffer.slice(buffer.offset, buffer.offset + 16).toBuffer();
			buffer.skip(16);
		}

		var sessionKey = SteamCrypto.generateSessionKey(nonce);
		this._tempUseHmac = !!nonce;
		this._tempSessionKey = sessionKey.plain;
		var keyCrc = BufferCRC32.signed(sessionKey.encrypted);

		var encResp = new this.Schema.MsgChannelEncryptResponse().encode();
		var body = new ByteBuffer(encResp.limit + 128 + 4 + 4, ByteBuffer.LITTLE_ENDIAN); // key, crc, trailer

		body.append(encResp);
		body.append(sessionKey.encrypted);
		body.writeInt32(keyCrc);
		body.writeUint32(0); // TODO: check if the trailer is required
		body.flip();

		this.Send({ msg: this.EMsg.ChannelEncryptResponse }, body.toBuffer());
	}

	Disconnect() {
		clearInterval(this._heartBeatFunc);
		this._connection.DestroyConnection();
		this.removeAllListeners();
	}

	GetProductInfo(apps, packages, callback) {
		// Steam can send us the full response in multiple responses, so we need to buffer them into one callback
		var appids = [];
		var packageids = [];
		var response = {
			"apps": {},
			"packages": {},
			"unknownApps": [],
			"unknownPackages": []
		};

		apps = apps.map(function (app) {
			if (typeof app === 'object') {
				appids.push(app.appid);
				return app;
			} else {
				appids.push(app);
				return { "appid": app };
			}
		});

		packages = packages.map(function (pkg) {
			if (typeof pkg === 'object') {
				packageids.push(pkg.packageid);
				return pkg;
			} else {
				packageids.push(pkg);
				return { "packageid": pkg };
			}
		});

		this.__Send(this.EMsg.ClientPICSProductInfoRequest, {
			"apps": apps,
			"packages": packages
		}, function (body) {
			(body.apps || []).forEach(function (app) {
				var data = {
					"changenumber": app.change_number,
					"missingToken": !!app.missing_token,
					"appinfo": VDF.parse(app.buffer.toString('utf8')).appinfo
				};
				app._parsedData = data;
			});

			(body.packages || []).forEach(function (pkg) {
				if(pkg.buffer == null){
					return;
				}
				var data = {
					"changenumber": pkg.change_number,
					"missingToken": !!pkg.missing_token,
					"packageinfo": BinaryKVParser.parse(pkg.buffer)[pkg.packageid]
				};
				pkg._parsedData = data;
			});

			if (!callback) {
				return;
			}

			(body.unknown_appids || []).forEach(function (appid) {
				response.unknownApps.push(appid);
				var index = appids.indexOf(appid);
				if (index != -1) {
					appids.splice(index, 1);
				}
			});

			(body.unknown_packageids || []).forEach(function (packageid) {
				response.unknownPackages.push(packageid);
				var index = packageids.indexOf(packageid);
				if (index != -1) {
					packageids.splice(index, 1);
				}
			});

			(body.apps || []).forEach(function (app) {
				response.apps[app.appid] = app._parsedData || {
					"changenumber": app.change_number,
					"missingToken": !!app.missing_token,
					"appinfo": VDF.parse(app.buffer.toString('utf8')).appinfo
				};

				var index = appids.indexOf(app.appid);
				if (index != -1) {
					appids.splice(index, 1);
				}
			});

			(body.packages || []).forEach(function (pkg) {
				response.packages[pkg.packageid] = pkg._parsedData || {
					"changenumber": pkg.change_number,
					"missingToken": !!pkg.missing_token,
					"packageinfo": BinaryKVParser.parse(pkg.buffer)[pkg.packageid]
				};

				var index = packageids.indexOf(pkg.packageid);
				if (index != -1) {
					packageids.splice(index, 1);
				}
			});

			if (appids.length === 0 && packageids.length === 0) {
				callback(response.apps, response.packages, response.unknownApps, response.unknownPackages);
			}
		});
	}

	__Send(emsg, body, callback) {
		if (!this.steamID || !this.connected) {
			return;
		}

		var header = {
			"msg": emsg
		};

		var Proto;
		if (emsg == 8903) {
			Proto = this.Schema.CMsgClientPICSProductInfoRequest
		}

		if (Proto) {
			header.proto = {};
			body = new Proto(body).toBuffer();
		}

		var self = this;
		var cb = null;
		if (callback) {
			cb = function (header, body) {
				if (header.msg == 8904) {
					body = self.Schema.CMsgClientPICSProductInfoResponse.decode(body);
				}
				callback(body);
			};
		}

		this.Send(header, body, cb);
	}

	ProcessProto(proto) {
		proto = proto.toRaw(false, true);
		(function deleteNulls(proto) {
			for (var field in proto)
				if (proto[field] == null)
					delete proto[field];
				else if (typeof proto[field] == 'object')
					deleteNulls(proto[field]);
		})(proto);
		return proto;
	}

	SortNumeric(a, b) {
		if (a < b) {
			return -1;
		} else if (a > b) {
			return 1;
		}
		return 0;
	}
}

module.exports = SteamClient;
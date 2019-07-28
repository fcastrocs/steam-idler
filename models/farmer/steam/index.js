'use strict';

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

		//establish the connection
		this._connection = new Connection(options);

		// Errors while connection is active
		this._connection.once("error", err => {
			clearInterval(this._heartBeatFunc)
			self.emit("error", err);
		})

		this._connection.on('packet', function (packet) {
			self.NetMsgReceived(packet);
		});
	}

	setPersona(state, name) {
		this._personaState = state;
		this.Send({
			msg: this.EMsg.ClientChangeStatus,
			proto: {}
		}, new this.Schema.CMsgClientChangeStatus({
			persona_state: state,
			player_name: name
		}).toBuffer());
	}


	playGames(games) {
		this.Send({
			msg: this.EMsg.ClientGamesPlayed,
			proto: {}
		}, new this.Schema.CMsgClientGamesPlayed(games).toBuffer());
	};

	LogOn(logOnDetails) {
		// construct temporary SteamID
		this.steamID = new SteamID({
			accountInstance: 1,
			accountUniverse: Steam.EUniverse.Public,
			accountType: Steam.EAccountType.Individual
		}).toString();

		logOnDetails.protocol_version = this.PROTOCOL_VERSION;
		this.Send({
			msg: this.EMsg.ClientLogon,
			proto: {}
		}, new this.Schema.CMsgClientLogon(logOnDetails).toBuffer());
	};

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

		if (eMsg !== this.EMsg.ClientUpdateMachineAuth) {
			this.HandlerSelect(eMsg, body);
		}

		if (sourceJobID != '18446744073709551615') {
			var callback = function (header, body, callback) {
				if (header.proto)
					header.proto.jobid_target = sourceJobID;
				else
					header.targetJobID = sourceJobID;
				this._Send(header, body, callback);
			}.bind(this);
		}

		if (targetJobID in this._jobs)
			this._jobs[targetJobID](header, body, callback);
		else {
			//this.emit('message', header, body, callback);
			if (eMsg == this.EMsg.ClientUpdateMachineAuth) {
				this.ClientUpdateMachineAuth(body, callback)
			}
		}
	};

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
	};


	HandlerSelect(msg, body) {
		if (msg == this.EMsg.ChannelEncryptRequest) {
			this.ChannelEncryptRequest(body);
		}
		else if (msg == this.EMsg.ChannelEncryptResult) {
			this.ChannelEncryptResult(body);
		}
		else if (msg == this.EMsg.Multi) {
			this.Multi(body);
		}
		else if (msg == this.EMsg.ClientLogOnResponse) {
			this.ClientLogOnResponse(body);
		}
		else if (msg == this.EMsg.ClientLicenseList) {
			this.ClientLicenseList(body);
		}
		else if (msg == this.EMsg.ClientAccountInfo) {
			let data = this.Schema.CMsgClientAccountInfo.decode(body);
			this.emit("persona", data.persona_name)
		}
		else if (msg == this.EMsg.ClientPersonaState) { //get avatar url
			//For some reason this is called twice.
			if (this.persona_state) { //only exectue once
				return;
			}
			this.persona_state = true;
			let data = this.Schema.CMsgClientPersonaState.decode(body);
			this.emit("avatar", this.getAvatarURL(data.friends[0].avatar_hash.toString('hex')))
		}
		/*else if (msg == this.EMsg.ClientNewLoginKey) { //accept loginkey
			let newLoginKey = this.Schema.CMsgClientNewLoginKey.decode(body);
			
			this.Send({
				msg: this.EMsg.ClientNewLoginKeyAccepted,
				proto: {}
			}, new this.Schema.CMsgClientNewLoginKeyAccepted({ unique_id: newLoginKey.unique_id }).toBuffer());

			this.emit('loginKey', newLoginKey.login_key);
		}*/
	};

	getAvatarURL(hash) {
		let tag = hash.substring(0, 2);
		let url = "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/"
		if (hash == "0000000000000000000000000000000000000000") { //return default avatar
			return `${url}/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`
		} else {
			return `${url}/${tag}/${hash}_full.jpg`
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
	};

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
	};

	ClientLogOnResponse(data) {
		var logonResp = this.Schema.CMsgClientLogonResponse.decode(data);
		var eresult = logonResp.eresult;

		// Account logged in successfully
		if (eresult == Steam.EResult.OK) {
			var hbDelay = logonResp.out_of_game_heartbeat_seconds;

			// Establish a heartbeat so we don't get disconnected
			// before we get vac, limited, email verification info
			this._heartBeatFunc = setInterval(function () {
				this.Send({
					"msg": this.EMsg.ClientHeartBeat,
					"proto": {}
				}, new this.Schema.CMsgClientHeartBeat().toBuffer());
			}.bind(this), hbDelay * 1000);
		}
		else { // Destroy the connection
			this._connection.DestroyConnection();
		}

		this.emit('logOnResponse', this.ProcessProto(logonResp));
	};

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
	};

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
	};

	ChannelEncryptRequest(data) {
		var buffer = ByteBuffer.wrap(data, ByteBuffer.LITTLE_ENDIAN);
		var protocol = buffer.readUint32();
		var universe = buffer.readUint32();
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
	};

	Disconnect() {
		clearInterval(this._heartBeatFunc)
		this.removeAllListeners();
		this._connection.DestroyConnection();
	}

	ClientLicenseList(body) {
		body = this.Schema.CMsgClientLicenseList.decode(body);
		this.licenses = body.licenses;
		this.GetLicenseInfo();
	};

	GetLicenseInfo() {
		var packageids = this.GetOwnedPackages();

		//no games in this acc
		if (!packageids) {
			this.emit('games', false)
			return;
		}

		var self = this;
		this.GetProductInfo([], packageids, function (apps, packages) {
			// Request info for all the apps in these packages
			var appids = [];
			for (var pkgid in packages) {
				// This package has expired. Free weekend, usually
				var extended = packages[pkgid].packageinfo.extended;
				if (extended && extended.expirytime && extended.expirytime <= Math.floor(Date.now() / 1000)) {
					continue;
				}

				self.packages.push(packages[pkgid])

				packages[pkgid].packageinfo.appids.forEach((appid) => {
					appids.push(appid);
				})
			}

			//bug? this function returns twice with the same info.
			//proceeded after the first return
			let returnCount = 0
			self.GetProductInfo(appids, [], function (apps, packages) {
				returnCount++;
				if (returnCount > 1) {
					return;
				}
				for (var id in apps) {
					if (!apps[id].appinfo || !apps[id].appinfo.common || !apps[id].appinfo.common.type) {
						continue;
					}
					var type = apps[id].appinfo.common.type.toLowerCase();
					if (type != 'game') {
						continue
					}
					self.apps.push(apps[id]);
				}
				self.PrepareGamesData();
			});
		});
	};


	GetOwnedPackages() {
		//Filter out the default steam package
		var packages = this.licenses.filter((license) => {
			if (license.package_id == 0) {
				return false;
			} else {
				return true;
			}
		}).map(function (license) {
			return license.package_id;
		});

		packages.sort(this.SortNumeric);

		//No games
		if (packages.length == 0) {
			return false
		}

		return packages;
	};

	SortNumeric(a, b) {
		if (a < b) {
			return -1;
		} else if (a > b) {
			return 1;
		}
		return 0;
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

	PrepareGamesData() {
		var games = new Array();
		for (var i in this.apps) {
			let game = {
				appId: this.apps[i].appinfo.common.gameid,
				name: this.apps[i].appinfo.common.name,
				logo: this.apps[i].appinfo.common.logo
			}
			games.push(game);
		}
		this.emit('games', games)
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
	};


}

module.exports = SteamClient;
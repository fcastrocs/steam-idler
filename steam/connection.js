'use strict';

const EventEmitter = require('events').EventEmitter;
const SocksClient = require('socks').SocksClient;
const SteamCrypto = require('@doctormckay/steam-crypto');

class Connection extends EventEmitter {
  constructor(options) {
    super();

    this.MAGIC = 'VT01';
    this.options = options;

    this.disconnectHandled = false;
  }

  Connect() {
    let self = this;

    return new Promise(async (resolve, reject) => {
      self.options.command = "connect";

      try {
        let info = await SocksClient.createConnection(self.options);
        self.socket = info.socket;

        //Socket timeout from inactivity
        self.socket.setTimeout(self.options.timeout);

        // handle this error, so app doesnt crash
        self.socket.once("error", () => { });

        self.socket.once('timeout', err => {
          if(self.disconnectHandled || self.disconnected){
            return;
          }
          self.disconnectHandled = true;

          self.DestroyConnection();
          self.emit("error", "socket timeout");
        });

        self.socket.once("close", () => {
          if(self.disconnectHandled || self.disconnected){
            return;
          }
          self.disconnectHandled = true;

          self.DestroyConnection();
          self.emit("error", "socket closed");
        });

        self.socket.on('readable', err => {
          self.ReadPacket();
        });

        return resolve("connected");

      } catch (error) {
        return reject("dead proxy");
      }

    })

  }

  // Sends data to steam
  Send(data) {
    if (this.sessionKey) {
      data = SteamCrypto.symmetricEncryptWithHmacIv(data, this.sessionKey);
    }

    let buf = Buffer.alloc(4 + 4 + data.length);
    buf.writeUInt32LE(data.length, 0);
    buf.write(this.MAGIC, 4);
    data.copy(buf, 8);

    if (this.socket && !this.socket.destroyed) {
      this.socket.write(buf);
    }

  };

  // Read packet from steam
  ReadPacket() {
    if (!this._packetLen) {
      // We are not in the middle of a message, so the next thing on the wire should be a header
      var header = this.socket.read(8);
      if (!header) {
        return; // maybe we should tear down the connection here
      }

      this._packetLen = header.readUInt32LE(0);
      if (header.slice(4).toString('ascii') != this.MAGIC) {
        this.emit('error', 'CONNECTION OUT OF SYNC');
        return;
      }
    }

    var packet = this.socket.read(this._packetLen);

    if (!packet) {
      this.emit('incomplete-packet', 'incomplete packet');
      return;
    }

    delete this._packetLen;
    this._packetLen = null;

    // decrypt
    if (this.sessionKey) {
      try {
        packet = SteamCrypto.symmetricDecrypt(packet, this.sessionKey, this.useHmac);
      } catch (ex) {
        this.emit('error', "ENCRYPTION ERROR");
        return;
      }
    }

    this.emit('packet', packet);
    // keep reading until there's nothing left
    this.ReadPacket();
  };

  // Destroy the connection and remove listeners
  DestroyConnection() {
    this.disconnected = true;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
    }
  }

}

module.exports = Connection;
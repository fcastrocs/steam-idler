'use strict';

const EventEmitter = require('events').EventEmitter;
const SocksClient = require('socks').SocksClient;
const SteamCrypto = require('@doctormckay/steam-crypto');

class Connection extends EventEmitter {

  constructor(options) {
    super();
    this.MAGIC = 'VT01';
    var self = this;

    options.command = "connect";

    // Create the connection with steam using socks type 4
    SocksClient.createConnection(options)
      .then(info => { //successful
        self.socket = info.socket;

        //Socket timeout from inactivity
        self.socket.setTimeout(options.timeout);
        // This will take care of any other errors
        self.socket.once('timeout', err => {
          self.DestroyConnection();
          self.emit("error", "socket timeout")
        });

        // Connection ended before login
        self.socket.once("end", err => {
          self.DestroyConnection();
          self.emit("error", "socket ended");
        })

        // Any errors with the connection
        self.socket.once("error", err => {
          self.DestroyConnection();
          self.emit("error", "socket error");
        })

        // socket had a transmission error
        self.socket.once("close", err => {
          if (err) {
            self.DestroyConnection();
            self.emit("error", "socket closed with error");
          }
        });

        self.socket.on('readable', err => {
          self.ReadPacket();
        });

      })
      .catch(err => {
        // Errors while trying to establish connection
        self.emit("error", "dead proxy");
      });
  }

  // Destroy the connection and remove listeners
  DestroyConnection() {
    if (!this.socket) {
      return;
    }
    this.socket.removeAllListeners();
    this.socket.destroy();
  }

  // Sends data to steam
  Send(data) {
    if (!this.socket) {
      return;
    }

    // encrypt
    if (this.sessionKey) {
      if (this.useHmac) {
        data = SteamCrypto.symmetricEncryptWithHmacIv(data, this.sessionKey);
      } else {
        data = SteamCrypto.symmetricEncrypt(data, this.sessionKey);
      }
    }

    var buffer = new Buffer.alloc(4 + 4 + data.length);
    buffer.writeUInt32LE(data.length, 0);
    buffer.write(this.MAGIC, 4);
    data.copy(buffer, 8);

    this.socket.write(buffer);
  };

  // Read packet from steam
  ReadPacket() {
    if (!this.socket) {
      return;
    }

    if (!this._packetLen) {
      var header = this.socket.read(8);
      if (!header) {
        return;
      }

      this._packetLen = header.readUInt32LE(0);
      if (header.slice(4).toString('ascii') != this.MAGIC) {
        console.log("Connection Error: Bad magic")
        this.emit('error', new Error('Bad magic'));
        this.end();
        return;
      }
    }

    var packet = this.socket.read(this._packetLen);

    if (!packet) {
      this.emit('incomplete-packet', 'incomplete packet');
      return;
    }

    delete this._packetLen;

    // decrypt
    if (this.sessionKey) {
      try {
        packet = SteamCrypto.symmetricDecrypt(packet, this.sessionKey, this.useHmac);
      } catch (ex) {
        console.log("ENCRYPTION ERROR")
        this.emit('encryptionError', ex);
        return;
      }
    }

    this.emit('packet', packet);
    // keep reading until there's nothing left
    this.ReadPacket();
  };

}

module.exports = Connection;
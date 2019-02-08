var ProtoBuf = require('protobufjs');
var Steam = exports;

Steam.Internal = loadProtoFiles([
  'steamclient/steammessages_base.proto',
  'steamclient/encrypted_app_ticket.proto',
  'steamclient/steammessages_player.steamclient.proto',
  'steamclient/steammessages_clientserver.proto',
  'steamclient/steammessages_clientserver_2.proto',
  'steamclient/steammessages_clientserver_friends.proto',
  'steamclient/steammessages_clientserver_login.proto'
]);

require('./steam_language_parser');

function loadProtoFiles(paths) {
  var builder = ProtoBuf.newBuilder();
  paths.forEach(function(path) {
    ProtoBuf.loadProtoFile(__dirname + '/protobufs/' + path, builder);
  });
  return builder.build();
}

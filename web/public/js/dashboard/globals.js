var apiLimit = false;
var farmingTaskIds = []
var lastReconnectTaskIds = []
var accounts_cache = [];
// Create a socket
var socket = io();

// set ajax request timeout
$.ajaxSetup({
    timeout: 10 * 60 * 1000
});

// accounts stats
var g_online = 0
var g_offline = 0
var g_accountsLength = 0;
var g_totalSecondsIdled = 0;
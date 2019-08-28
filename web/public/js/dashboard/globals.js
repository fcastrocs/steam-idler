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
var apiLimit = false;
var farmingTaskIds = []
var lastReconnectTaskIds = []

// Create a socket
var socket = io();

// set ajax request timeout
$.ajaxSetup({
    timeout: 10 * 60 * 1000
});
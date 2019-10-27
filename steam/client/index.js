/* eslint-disable require-atomic-updates */
"use strict";

const Steam = require('../index')
const EventEmitter = require('events').EventEmitter;
const GetProxy = require('../../util/proxy').GetProxy;
const GetSteamCM = require('../../util/steamcm').GetSteamCM
const RemoveProxy = require("../../util/proxy").RemoveProxy
const GetAndSaveProxies = require('../../util/proxy').GetAndSaveProxies;
const SteamTotp = require('steam-totp');
const io = require("../../app").io;

class Client extends EventEmitter {
    constructor(loginOptions, socketId) {
        super();

        // add helper functions
        let functionsObj = require("./steamcommunity");
        let funcNames = Object.keys(functionsObj);

        let index = 0;
        for (let i in functionsObj) {
            this[`${funcNames[index]}`] = functionsObj[i]
            index++;
        }

        // add actions
        functionsObj = require("./actions");
        funcNames = Object.keys(functionsObj);

        index = 0;
        for (let i in functionsObj) {
            this[`${funcNames[index]}`] = functionsObj[i]
            index++;
        }

         // add listeners
         functionsObj = require("./listeners");
         funcNames = Object.keys(functionsObj);
 
         index = 0;
         for (let i in functionsObj) {
             this[`${funcNames[index]}`] = functionsObj[i]
             index++;
         }

        this.fetchingProxies = false;
        this.socketId = socketId

        // copy login options obj
        this.account = {}
        Object.assign(this.account, loginOptions);

        this.CONNECTION_TIMEOUT = 5 // in seconds

        if (this.socketId) {
            io.to(`${this.socketId}`).emit("login-log-msg", "Connecting to Steam.");
        }


        let timeout = 0;
        if(loginOptions.initializing){
            timeout = Math.floor(Math.random() * 60) * 1000;
        }
        setTimeout(() => {
            this.connect();
        }, timeout);
    }

    /**
     * Attempts steam login, must be connected to steam first.
     */
    login() {
        // register login listener
        this.loginListener()
        // register afterlogin listener
        this.afterLoginListeners();
        // Login to steam
        this.client.LogOn(this.setupLoginOptions());
    }

    /**
     * Login() helper function to setup login options
     */
    setupLoginOptions(){
        // Setup login options
        let loginOptions = {
            account_name: this.account.user,
            password: this.account.pass,
            supports_rate_limit_response: true,
            client_os_type: 16,
            ping_ms_from_cell_search: 4 + Math.floor(Math.random() * 60)

        }

        // Login with sentry file
        if (this.account.sentry) {
            loginOptions.sha_sentryfile = this.account.sentry
        }

        // Email code
        if (this.account.emailGuard) {
            loginOptions.auth_code = this.account.emailGuard;
        }

        //Generate mobile code if needed
        if (this.account.shared_secret) {
            loginOptions.two_factor_code = SteamTotp.generateAuthCode(this.account.shared_secret);
        }

        return loginOptions;
    }

    /**
     * Establishes steam connection
     * @param {*} options connection options
     */
    async connect(options) {
        let self = this;

        // Get a SteamCM, use previous proxy if options.usePrevious is set
        if (!options || !options.usePrevious) {
            this.steamcm = await GetSteamCM();
            this.proxy = await GetProxy();

            // proxy list is empty, fetch more proxies.
            if (!this.proxy) {
                // havent started fetching a new list
                if (process.env.fetchingProxies === "false") {
                    console.error("Steam is down, getting a new proxy list in 14 mins");
                    process.env.fetchingProxies = "true";
                    setTimeout(async () => {
                        await GetAndSaveProxies();
                        process.env.fetchingProxies = "false";
                        self.connect();
                    }, 14 * 60 * 1000);
                    return;
                } else {
                    // reconnect in between 15 to 20 mins
                    let mins = (Math.random() * (20.0 - 15.0) + 15.0).toFixed(2);
                    let timeout = Math.floor(mins * 60 * 1000);
                    console.error(`Steam is down, waiting ${mins} mins until reconnect > ${this.account.user}`);
                    setTimeout(() => self.connect(), timeout);
                    return;
                }
            }
        }

        // connection options
        this.options = {
            timeout: this.CONNECTION_TIMEOUT * 1000, //timeout for bad proxy
            proxy: {
                ipaddress: this.proxy.ip,
                port: this.proxy.port,
                type: 4
            },
            destination: {
                host: this.steamcm.ip,
                port: this.steamcm.port
            }
        }

        // Create the steam client
        this.client = new Steam(self.options);

        // register connection listeners
        this.connectionListeners();

        // connect to steam
        try {
            await self.client.Connect();
        } catch (err) {
            self.RenewConnection(err);
        }
    }

    /**
     * Reconnecto to steam
     * @param {*} err error that triggered reconnection
     */
    RenewConnection(err) {
        this.reconnecting = true;
        this.Disconnect();
        // Remove the proxy
        RemoveProxy(this.proxy);
        console.log(`Reconnecting: ${err} > user: ${this.account.user} | proxy IP: ${this.proxy.ip}`);
        this.connect();
    }

    /**
     * Disconnect from steam
     */
    Disconnect() {
        this.loggedIn = false;
        this.webCookie = false;
        this.client.Disconnect();
    }

}

module.exports = Client;
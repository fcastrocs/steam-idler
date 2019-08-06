"use strict";

const EventEmitter = require('events').EventEmitter;
const SteamAccount = require('../models/steam-accounts')
const SteamAccHandler = require('../models/steamacc-handler')


class AccountHandler extends EventEmitter {
    constructor() {
        super();

        // add helper functions
        let functionsObj = require("./helpers");
        let funcNames = Object.keys(functionsObj);

        let index = 0;
        for (let i in functionsObj) {
            this[`${funcNames[index]}`] = functionsObj[i]
            index++;
        }

        // add steam functions
        functionsObj = require("./steam");
        funcNames = Object.keys(functionsObj);

        index = 0;
        for (let i in functionsObj) {
            this[`${funcNames[index]}`] = functionsObj[i]
            index++;
        }

        // add farming functions into class
        functionsObj = require("./farming");
        funcNames = Object.keys(functionsObj);

        index = 0;
        for (let i in functionsObj) {
            this[`${funcNames[index]}`] = functionsObj[i]
            index++;
        }

        this.userAccounts = new Object();

        this.init();
    }

    // Sets all accounts offline status and brings online accounts in handlers
    async init() {
        //first change status of all accounts to offline
        let accounts = await this.getAllAccounts();
        if (accounts.length == 0) {
            return Promise.reject("No accounts to initialize.");
        }

        // set all accounts to offline status
        for (let i in accounts) {
            accounts[i].status = "Offline"
            this.saveAccount(accounts[i])
        }

        let handlers = await this.getAllUserHandlers();
        if (handlers.length == 0) {
            return Promise.reject("No accounts to initialize.");
        }

        console.log("Initializing accounts.")

        // Bring online accounts in handlers
        for (let i in handlers) {
            this.bringOnline(handlers[i])
        }
    }


    async bringOnline(handler) {
        let accountIds = handler.accountIds
        if (accountIds.length == 0) {
            return;
        }

        for (let i in accountIds) {

            // find account
            let doc = await this.getAccount(null, accountIds[i], null)
            if (!doc) {
                console.log(`Could not initialize account ${accountIds[i]}`)
                continue;
            }

            try {
                // set up login options
                let options = this.setupLoginOptions(doc);
                let client = await this.steamConnect(options);

                // save account to handler
                this.saveToHandler(doc.userId, doc._id.toString(), client)

                // update account properties after login
                doc.games = this.addGames(options.games, doc.games);
                doc.persona_name = options.persona_name;
                doc.avatar = options.avatar;
                doc.status = options.status;

                // Restart farming or idling
                this.farmingIdlingRestart(client, doc)
            } catch (error) {
                //could not login to account, update it's status
                doc.status = error;
                this.saveAccount(doc)
            }
        }
    }
}

module.exports = AccountHandler;
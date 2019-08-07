"use strict";

module.exports = class AccountHandler {
    constructor() {
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
        this.reCheckInterval = 31 * 60 * 1000; // 31 mins

        this.init();
    }

    /**
     * Initializes all accounts in database that should be online/farming/idling
     * First, sets all accounts Offline status, then initializes
     */
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

    /**
     * Brings online user accounts
     * Sets account to idle/farm
     */
    async bringOnline(handler) {
        let accountIds = handler.accountIds
        if (accountIds.length == 0) {
            return;
        }

        // loop through all user's accounts
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
                doc.inventory = options.inventory

                // Restart farming or idling, this will also save the account
                this.farmingIdlingRestart(client, doc)
            } catch (error) {
                //could not login to account, update it's status
                doc.status = error;
                this.saveAccount(doc)
            }
        }
    }
}
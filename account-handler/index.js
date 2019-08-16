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

        this.FARMING_RECHECK_INTERVAL = 31 * 60 * 1000
        this.FARMING_GETFARMINGDATA_RETRYTIME = 8000
        this.FARMING_RESTARTIDLING_DELAY = 5000
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

        // Bring online accounts
        for (let i in handlers) {
            try {
                await this.loginAccount(handlers[i].userId, handlers[i].accountId, {
                    skipOnlineCheck: true, // at this point no account is online
                    skipHandlerSave: true // don't need to save to handler
                });
            } catch (error) {
                continue;
            }
        }

        return Promise.resolve();
    }
}
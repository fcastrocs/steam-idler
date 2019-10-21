"use strict";
const allSettled = require('promise.allsettled');

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

        this.FARMING_RECHECK_INTERVAL = 30 * 60 * 1000;
        this.FARMING_GETFARMINGDATA_RETRYTIME = 8000
        this.FARMING_RESTARTIDLING_DELAY = 5000
    }

    /**
     * Initializes all accounts in database that should be online/farming/idling
     */
    async init() {
        let accounts = await this.getAllAccounts();
        if (accounts.length == 0) {
            return Promise.reject(" - no accounts to initialize");
        }

        let handlers = await this.getAllUserHandlers();
        if (handlers.length == 0) {
            return Promise.reject(" - no accounts to initialize");
        }

        console.log(` - initializing ${handlers.length} accounts`)

        // Bring online accounts
        let promises = [];
        for (let i in handlers) {
            promises.push(this.loginAccount(handlers[i].userId, handlers[i].accountId, {
                skipOnlineCheck: true, // at this point no account is online
            }))
        }

        return new Promise(resolve => {
            allSettled(promises).then(() => resolve());
        })
    }
}
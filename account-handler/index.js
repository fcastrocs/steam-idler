"use strict";
const allSettled = require('promise.allsettled');
const Accounts = require("../models/steam-accounts");

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
    }

    /**
     * Initializes all accounts in database that should be online/farming/idling
     */
    async init() {
        let count = await Accounts.countDocuments().exec();
        if (count == 0) {
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
            promises.push(this.loginAccount(handlers[i].userId, handlers[i].accountId, {initializing: true}))
        }

        return new Promise(resolve => {
            allSettled(promises).then(() => resolve())
        })
    }
}
"use strict";

const Client = require('./farmer/client.js')
const EventEmitter = require('events').EventEmitter;
const SteamAccount = require('./models/steam-accounts')
const SteamAccHandler = require('./models/steamacc-handler')
const Security = require("./util/security")

class AccountHandler extends EventEmitter {
    constructor() {
        super();

        this.userAccounts = new Object();
        this.initializeHandlers()
    }

    // Brings all accounts in user handlers back online
    async initializeHandlers() {
        //first change status of all accounts to offline
        let query = SteamAccount.find({})
        let accounts = await query.exec();

        for (let i in accounts) {
            accounts[i].status = "offline"
            await this.saveAccount(accounts[i])
        }

        console.log("Initializing accounts.")
        //Get all user handlers
        query = SteamAccHandler.find();
        let handlers = await query.exec();
        //Nothing to do
        if (!handlers || handlers.length == 0) {
            return false
        }

        //loop through all user handlers and bring accounts online
        for (let i = 0; i < handlers.length; i++) {
            let accountIds = handlers[i].accountIds
            for (let j = 0; j < accountIds.length; j++) {
                // find account
                let doc = await this.getAccount(null, accountIds[j], null)
                if (!doc) {
                    console.log("something went wrong initializing account")
                    continue;
                }

                try {
                    let options = this.setupLoginOptions(doc);
                    let client = await this.steamConnect(options);

                    //save and store client
                    this.saveToHandler(doc.userId, doc._id.toString(), client)

                    //update account properties after login
                    doc.games = options.games;
                    doc.persona_name = options.persona_name;
                    doc.avatar = options.avatar;

                    this.saveAccount(doc)
                } catch (error) {
                    //could not login to account, update it's status
                    doc.status = error;
                    this.saveAccount(doc)
                }
            }
        }
        console.log("Accounts initialized.")
    }

    /************************************************************************
    * 					          CHANGE NICK					            *
    ************************************************************************/
    async changeNick(userId, accountId, name) {
        let client = this.isAccountOnline(userId, accountId);
        if (!client) {
            return Promise.reject("Account is not online.");
        }
        client.setPersona(1, name)

        let account = await this.getAccount(userId, accountId);
        if (!account) {
            return Promise.reject("Account not found.")
        }
        account.persona_name = name;
        await this.saveAccount(account);
        return Promise.resolve(name);
    }



    /************************************************************************
    * 					          PLAY GAME					                *
    ************************************************************************/
    async playGames(userId, accountId, games) {
        let self = this;
        return new Promise(async function (resolve, reject) {

            let client = self.isAccountOnline(userId, accountId);
            if (!client) {
                return reject("Account is not online.");
            }

            // Play games
            client.playGames(games)

            //save playing games to account and force correct status
            let account = await self.getAccount(userId, accountId);
            account.gamesPlaying = games;
            if (games.length == 0) {
                account.status = "online"
            } else {
                account.status = "in-game"
            }
            await self.saveAccount(account);
            resolve("okay");
        })
    }

    /************************************************************************
     * 			        CONNECT TO STEAM AND REGISTER EVENTS			    *
     ************************************************************************/
    async steamConnect(account) {
        let self = this;
        // Resolve promise once we get needed data
        return new Promise(async function (resolve, reject) {
            let event_count = 0

            // Create client
            let client = new Client(account);

            // Register needed events

            // account has logged in
            client.on('steamid', steamid => {
                account.steamid = steamid;
            })

            // login error has occurred
            client.on("loginError", err => {
                account.status = err;
                return reject(err)
            })

            // sentry has been accepted
            client.on("sentry", sentry => {
                account.sentry = sentry
            })

            // games in account
            client.on("games", games => {
                event_count++;
                account.games = games
                if (event_count === 3) {
                    return resolve(client);
                }
            })

            // persona name/nick
            client.on("persona-name", persona_name => {
                event_count++
                // no name?
                if (!persona_name) {
                    account.persona_name = "No Nickname?"
                } else {
                    account.persona_name = persona_name
                }
                if (event_count === 3) {
                    return resolve(client);
                }
            })

            // account avatar
            client.on("avatar", avatar => {
                event_count++;
                account.avatar = avatar
                if (event_count === 3) {
                    return resolve(client);
                }
            })

            client.on("in-game", async (res) => {
                //find acc by user
                let doc = await self.getAccount(null, null, account.user);
                if (!doc) {
                    return;
                }

                doc.status = res
                self.saveAccount(doc);
            })

            // connection has been lost after being logged in
            client.on("connection-lost", async () => {
                //find acc by user
                let doc = await self.getAccount(null, null, account.user);
                if (!doc) {
                    return;
                }
                doc.status = "reconnecting";
                self.saveAccount(doc);
            })

            // connection has been regained after being logged in
            client.on("connection-gained", async () => {
                //find acc by user
                let doc = await self.getAccount(null, null, account.user);
                if (!doc) {
                    return;
                }
                doc.status = "online";
                self.saveAccount(doc);
            })

            // client.once("loginKey", loginKey => {
            //     account.loginKey = loginKey
            // })
        })
    }


    /************************************************************************
     * 					     LOGIN STEAM ACCOUNT			                *
     ************************************************************************/
    async loginAccount(userId, accountId) {
        let self = this;
        return new Promise(async function (resolve, reject) {

            let doc = await self.getAccount(userId, accountId)
            // account not found
            if (!doc) {
                return reject("Account not found.")
            }

            let client = self.isAccountOnline(userId, accountId);
            if (client) {
                return reject("Account is already online.");
            }

            try {
                let options = self.setupLoginOptions(doc);
                let client = await self.steamConnect(options);
                self.saveToHandler(userId, accountId, client);

                //update account properties after login
                doc.games = options.games;
                doc.persona_name = options.persona_name;
                doc.avatar = options.avatar;
                doc.status = "online"
                self.saveAccount(doc)
                return resolve("online")
            } catch (error) {
                //login error
                doc.status = error;
                self.saveAccount(doc)
                return reject(error);
            }
        })
    }

    /************************************************************************
     * 					     LOGOUT STEAM ACCOUNT			                *
     ************************************************************************/
    async logoutAccount(userId, accountId) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            //Find account in DB
            let doc = await self.getAccount(userId, accountId)
            // account not found
            if (!doc) {
                return reject("Account not found.")
            }

            // check account is logged in
            let client = self.isAccountOnline(userId, accountId);
            if (!client) {
                //force offline status
                doc.status = "offline";
                self.saveAccount(doc);
                return resolve("offline")
            }

            // logout account
            client.Disconnect();

            // Remove handler
            self.removeFromHandler(userId, accountId);

            //finally update account status to offline
            doc.status = "offline";
            self.saveAccount(doc)
            return resolve("offline");
        })
    }


    /************************************************************************
     * 					            ADD ACCOUNT				                 *
     ************************************************************************/
    async addAccount(userId, account) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            //Find account in DB
            let doc = await self.getAccount(userId, null, account.user);
            if (doc) {
                return reject("Account already in DB.");
            }

            //try to login to steam
            try {
                let client = await self.steamConnect(account);

                //save account to database
                let steamacc = new SteamAccount({
                    userId: userId,
                    user: account.user,
                    pass: Security.encrypt(account.pass),
                    sentry: Security.encrypt(account.sentry),
                    status: "online",
                    games: account.games,
                    steamid: account.steamid,
                    persona_name: account.persona_name,
                    avatar: account.avatar
                })

                // Only 2FA accs get shared secret
                if (account.shared_secret) {
                    steamacc.shared_secret = Security.encrypt(account.shared_secret);
                }

                // Save to database
                doc = await self.saveAccount(steamacc)

                //save and store account to handler
                self.saveToHandler(userId, doc._id, client);
                return resolve(doc)

            } catch (error) {
                console.log(error)
                return reject(error);
            }
        })
    }


    /************************************************************************
    *               	        ACTIVATE FREE GAME	        	            *
    ************************************************************************/
    async activateFreeGame(userId, accountId, appIds) {
        // check account is logged in
        let client = this.isAccountOnline(userId, accountId);
        if (!client) {
            return Promise.reject("Account is not online.")
        }

        //find account in db
        let acc = await this.getAccount(userId, accountId, null);
        if (!acc) {
            return Promise.reject("Account not found.")
        }

        try {
            let games = await client.activateFreeGame(appIds)
            acc.games = this.addGames(games, acc.games);
            this.saveAccount(acc)
            return Promise.resolve(games)
        } catch (error) {
            console.log(error)
            return Promise.reject(error)
        }
    }


    /************************************************************************
    *               	        REDEEM CD KEY	        	                *
    ************************************************************************/
    async redeemKey(userId, accountId, cdkey) {
        // check account is logged in
        let client = this.isAccountOnline(userId, accountId);
        if (!client) {
            return Promise.reject("Account is not online.")
        }

        //find account in db
        let acc = await this.getAccount(userId, accountId);
        if (!acc) {
            return Promise.reject("Account not found.")
        }

        try {
            let games = await client.redeemKey(cdkey)
            acc.games = this.addGames(games, acc.games);
            this.saveAccount(acc);
            return Promise.resolve(games);
        } catch (error) {
            console.log(error)
            return Promise.reject(error)
        }
    }


    /************************************************************************
    * 					          HELPER FUNCTIONS					        *
    ************************************************************************/

    // adds acquired games to account games
    // returns accountGames array
    addGames(games, accountGames) {
        // check if game is already in acc.games
        // trick, convert object to string and check for equality
        for (let i in games) {
            let game = JSON.stringify(games[i])
            let found = false;

            for (let j in accountGames) {
                //convert to strong
                let accGame = JSON.stringify(accountGames[j])
                if (game === accGame) {
                    found = true;
                    break;
                }
            }

            // push game to accountGames if it was not found
            if (!found) {
                accountGames.push(games[i])
            }
        }
        return accountGames;
    }



    // Setup login options
    setupLoginOptions(acc) {
        let options = {
            user: acc.user,
            pass: Security.decrypt(acc.pass),
            sentry: Security.decrypt_buffer(acc.sentry),
            gamesPlaying: acc.gamesPlaying
        }

        if (acc.shared_secret) {
            options.shared_secret = Security.decrypt(acc.shared_secret)
        }
        return options;
    }

    // Remove from handler
    async removeFromHandler(userId, accountId) {
        // Remove account from local handler
        if (this.userAccounts[userId] && this.userAccounts[userId][accountId]) {
            this.userAccounts[userId][accountId] = null
        }

        // Get handler
        let handler = await SteamAccHandler.findOne({ userId: userId })
        if (!handler) {
            return;
        }
        handler.accountIds = handler.accountIds.filter(accId => {
            return accId.toString() !== accountId
        });
        handler.save();
    }

    // Returns accounts client if it's online
    isAccountOnline(userId, accountId) {
        let client = this.findClient(userId, accountId);
        if (!client) {
            return false;
        }

        if (!client.loggedIn) {
            return false
        }
        return client;
    }

    // Returns client for steam account
    findClient(userId, accountId) {
        if (!this.userAccounts[userId] || !this.userAccounts[userId][accountId]) {
            return false;
        }
        return this.userAccounts[userId][accountId]
    }


    // Get steam account from database
    async getAccount(userId, accountId, user) {
        let query = null;

        // find by userId and accountId
        if (userId && accountId) {
            query = SteamAccount.findOne({ _id: accountId, userId: userId })
        }
        // find by userId and user
        else if (userId && user) {
            query = SteamAccount.findOne({ userId: userId, user: user })
        }
        // find by user
        else if (!userId && !accountId && user) {
            query = SteamAccount.findOne({ user: user })
        }
        // find by id
        else if (!userId && accountId && !user) {
            query = SteamAccount.findById(accountId)
        } else {
            return null;
        }

        return await query.exec();
    }

    // Save steam account to database
    async saveAccount(account) {
        return new Promise((resolve, reject) => {
            account.save((err, doc) => {
                resolve(doc)
            })
        })
    }

    // Saves account to handlers
    async saveToHandler(userId, accountId, client) {
        // store the client
        // check if user doesn't have a dictionary yet
        if (!this.userAccounts[userId]) {
            this.userAccounts[userId] = [];
        }
        // Store the client to the handler
        this.userAccounts[userId][accountId] = client;

        // Save to DB
        let query = SteamAccHandler.findOne({ userId: userId })
        let handler = await query.exec();

        // user already has a handler in DB
        if (handler) {
            // Trick to make sure no duplicates. Try to remove it, then insert

            // Try to remove the accountId from the handler
            handler.accountIds = handler.accountIds.filter(accId => {
                return accId.toString() !== accountId
            });

            // if it was deleted, push it again
            handler.accountIds.push(accountId)
        }
        else {
            // user doesnt have a handler yet.
            handler = new SteamAccHandler({
                userId: userId,
                accountIds: [accountId]
            })
        }
        // save the handler.
        handler.save()
    }






}



module.exports = AccountHandler;
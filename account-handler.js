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
        console.log("Initializing accounts.")
        //Get all user handlers
        let query = SteamAccHandler.find();
        let handlers = await query.exec();
        //Nothing to do
        if (!handlers || handlers.length == 0) {
            return false
        }

        //loop through all user handlers and bring accounts online
        for (let i = 0; i < handlers.length; i++) {
            let accountIds = handlers[i].accountIds
            for (let j = 0; j < accountIds.length; j++) {
                query = SteamAccount.findById(accountIds[j])
                let doc = await query.exec();

                if (!doc) { // ???
                    console.log("something went wrong")
                    continue;
                }

                try {
                    let account = this.setupAccountDetails(doc)
                    let client = await this.connectSteam(account);

                    //save and store client
                    this.saveToHandler(doc.userId, doc._id.toString(), client)

                    //update account properties after login
                    doc.games = account.games;
                    doc.persona_name = account.persona_name;
                    doc.avatar = account.avatar;

                    // Set online status
                    doc.status = "online"
                    // check if account is playing games
                    if (doc.gamesPlaying.length > 0) {
                        doc.status = "in-game"
                    }

                    doc.save();
                } catch (error) {
                    //could not login to account, update it's status
                    doc.status = error;
                    doc.save();
                }
            }
        }
        console.log("Accounts initialized.")
    }

    async changeNick(userId, accountId, name) {
        let client = this.findClient(userId, accountId);
        if (!client) {
            return Promise.reject("Account not online");
        } else {
            client.setPersona(1, name)
            return Promise.resolve("okay");
        }
    }

    async playGames(games, userId, accountId) {
        let self = this;
        return new Promise(async function (resolve, reject) {

            //find client
            let client = self.findClient(userId, accountId);
            if (!client) {
                return reject("Account not online.")
            }

            let games_played = [];
            for (let i = 0; i < games.length; i++) {
                games_played.push({ game_id: games[i] })
            }

            // Play games
            client.playGames({ games_played })

            //save playing games to database
            let query = SteamAccount.findOne({ userId: userId, _id: accountId });
            let account = await query.exec();
            account.gamesPlaying = games_played;

            if (games.length === 0) {
                account.status = "online"
            } else {
                account.status = "in-game"
            }

            account.save((err, doc) => {
                return resolve(doc.status)
            })
        })
    }

    // Helper function
    // Connects an account to steam
    async connectSteam(account) {
        return new Promise(async function (resolve, reject) {
            let event_count = 0

            let client = new Client(account);

            client.once('loggedIn', res => {
                account.steamid = res.client_supplied_steamid;
            })

            client.once("loginError", err => {
                account.status = err;
                client.Disconnect();
                return reject(err)
            })

            client.once("sentry", sentry => {
                account.sentry = sentry
            })

            // client.once("loginKey", loginKey => {
            //     account.loginKey = loginKey
            // })

            client.once("games", games => {
                event_count++;
                account.games = games
                if (event_count === 3) {
                    return resolve(client);
                }
            })

            client.once("persona", persona_name => {
                event_count++
                account.persona_name = persona_name
                if (event_count === 3) {
                    return resolve(client);
                }
            })

            client.once("avatar", avatar => {
                event_count++;
                account.avatar = avatar
                if (event_count === 3) {
                    return resolve(client);
                }
            })
        })
    }

    // Helper function to setup account details for login
    setupAccountDetails(acc) {
        let account = {
            user: acc.user,
            pass: Security.decrypt(acc.pass),
            gamesPlaying: acc.gamesPlaying
        }

        if (acc.sentry) {
            account.sentry = Security.decrypt_buffer(acc.sentry);
        }

        if (acc.shared_secret) {
            account.shared_secret = Security.decrypt(acc.shared_secret)
        }
        return account;
    }


    // Login steam account
    async loginAccount(userId, accountId) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            //Find account in DB
            let query = SteamAccount.findOne({
                _id: accountId,
                userId: userId,
            })
            let doc = await query.exec();

            // account not found
            if (!doc) {
                return reject("Account not found.")
            }

            // account already logged in
            if (self.findClient(userId, accountId)) {
                return reject("Account is already logged in.")
            }

            try {
                let account = self.setupAccountDetails(doc)

                let client = await self.connectSteam(account);
                self.saveToHandler(userId, accountId, client);

                //update account properties after login
                doc.games = account.games;
                doc.persona_name = account.persona_name;
                doc.avatar = account.avatar;

                //set account status to online
                doc.status = "online"

                // check if account is playing games
                if (doc.gamesPlaying.length > 0) {
                    doc.status = "in-game"
                }

                doc.save((err, doc) => {
                    return resolve(doc.status)
                })
            } catch (error) {
                //login error
                doc.status = error;
                doc.save();
                return reject(error);
            }
        })
    }

    // Logout steam account
    async logoutAccount(userId, accountId) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            //Find account in DB
            let query = SteamAccount.find({
                _id: accountId,
                userId: userId,
            })
            let doc = await query.exec();

            // account not found
            if (doc.length < 1) {
                return reject("Account not found.")
            }

            // check account is logged in
            let client = self.findClient(userId, accountId)
            if (!client) {
                return reject("Account not logged in.")
            }

            // logout account
            client.Disconnect();

            // Remove account from local handler
            if (self.userAccounts[userId] && self.userAccounts[userId][accountId]) {
                self.userAccounts[userId][accountId] = null
            }

            // Remove account from handler 
            let handler = await SteamAccHandler.findOne({ userId: userId }).exec();
            if (handler) {
                handler.accountIds = handler.accountIds.filter(accId => {
                    return accId.toString() !== accountId
                });
                handler.save();
            }

            //finally update account status to offline
            doc[0].status = "offline"
            doc[0].save((err, doc) => {
                return resolve(doc.status);
            })
        })
    }


    /*  Connects account to steam
        Stores account to DB
        adds account to user handler
    */
    addAccount(userId, account) {
        let self = this;
        return new Promise(async function (reject, resolve) {
            // Check if account is already in DB
            let query = SteamAccount.findOne({
                userId: userId,
                user: account.user
            })
            let doc = await query.exec();

            if (doc) {
                return reject("Account already in DB.");
            }

            //try to login to steam
            try {
                let client = await self.connectSteam(account);

                // 2FA accounts don't get a sentry
                if (account.sentry) {
                    account.sentry = Security.encrypt(account.sentry)
                } else {
                    account.sentry = null;
                }

                //save account to database
                let steamacc = new SteamAccount({
                    userId: userId,
                    user: account.user,
                    pass: Security.encrypt(account.pass),
                    shared_secret: Security.encrypt(account.shared_secret),
                    sentry: account.sentry,
                    status: "online",
                    games: account.games,
                    steamid: account.steamid,
                    persona_name: account.persona_name,
                    avatar: account.avatar
                })

                steamacc.save((err, doc) => {
                    //save and store account to handler
                    self.saveToHandler(userId, doc._id, client);
                    return resolve("okay")
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    // Stores client to this.userAccounts for future reference
    // Saves accountId to user's handler
    async saveToHandler(userId, accountId, client) {
        // store the client
        // check if user doesn't have a dictionary yet
        if (!this.userAccounts[userId]) {
            this.userAccounts[userId] = [];
        }
        this.userAccounts[userId][accountId] = client;

        // Save to DB
        let query = SteamAccHandler.findOne({ userId: userId })
        let handler = await query.exec();

        // user already has a handler in DB
        if (handler) {
            //Remove acc from handler if it's there
            handler.accountIds = handler.accountIds.filter(accId => {
                return accId.toString() !== accountId
            });

            //Reinsert it
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

    // Returns user's account client for this accountId
    findClient(userId, accountId) {
        if (!this.userAccounts[userId] || !this.userAccounts[userId][accountId]) {
            return false;
        }
        return this.userAccounts[userId][accountId]
    }
}

module.exports = AccountHandler;
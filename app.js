const compression = require('compression');
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const bodyParser = require("body-parser");
const session = require('express-session');
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session);
const helmet = require('helmet')
const GetAndSaveProxies = require('./util/proxy').GetAndSaveProxies;
const AccountHandler = require("./account-handler");
const SteamAccount = require('./models/steam-accounts')
const ApiLimiter = require('./models/api-limiter')

// Declare process variables
// used when steam goes down.
process.env.fetchingProxies = "false";

// Handler must be kept in RAM at all times
let accountHandler = new AccountHandler();
module.exports.accountHandler = accountHandler;

//Initialization process.
(async () => {
    console.log("++ INITIALIZING APP ++")

    // Connect to database
    try {
        let res = await DBconnect();
        console.log(res);
    } catch (error) {
        console.log(error);
        process.exit();
    }

    // clean up database
    try {
        let res = await cleanup();
        console.log(res)
    } catch (error) {
        console.log(error);
        process.exit();
    }

    /*// Fetch proxies
    try {
        let count = await fetchProxies();
        console.log(` - ${count} proxies fetched`)
    } catch (error) {
        console.log(error);
    }*/

    // Initialize accounts in handlers
    try {
        await accountHandler.init();
    } catch (error) {
        console.log(error);
    }

    // Initialize express.js
    initExpress();
})();

async function DBconnect() {
    try {
        await mongoose.connect(process.env.MOGODB_URI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            autoReconnect: true,
            reconnectTries: 100,
            dbName: process.env.DATABASE
        })
        return Promise.resolve(' - connected to mongodb');
    } catch (error) {
        return Promise.reject(' - could not connect to mongodb');
    }
}

async function cleanup() {

    try {
        // clean up accounts
        let change = {
            status: "Offline",
            lastHourReconnects: 0
        }
        await SteamAccount.updateMany({}, change).exec();

        //clean up api limiter
        await ApiLimiter.deleteMany({}).exec();
        return Promise.resolve(" - db cleaned up");
    } catch (error) {
        console.log(error)
        return Promise.reject(" - could not clean up db")
    }

}

async function fetchProxies() {
    try {
        let res = await GetAndSaveProxies();
        return Promise.resolve(res);
    } catch (error) {
        return Promise.reject(error);
    }
}

function initExpress() {
    // set HTTP headers appropriately to counter web vulnerabilities
    app.use(helmet())

    app.use(compression());

    // public folder
    app.use('/static', express.static(`${__dirname}/web/public`))

    // Use body-parser
    app.use(bodyParser.json({ limit: '10mb', extended: true }))
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

    // use Handlebars view engine
    app.engine('.hbs', exphbs({
        extname: '.hbs',
        layoutsDir: `${__dirname}/web/views/layouts`,
        defaultLayout: 'main',
        partialsDir: `${__dirname}/web/views/partials`
    }));
    app.set('view engine', '.hbs')
    app.set('views', `${__dirname}/web/views`);

    // Set up sessions
    app.use(session({
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            ttl: 15 * 24 * 60 * 60 // = 15 days. Default
        }),
        secret: process.env.MONGOSTORE_SECRET,
        resave: false, //don't save session if unmodified
        saveUninitialized: false, // don't create session until something stored
        name: 'sessionID',
        cookie: { httpOnly: false, expires: 15 * 24 * 60 * 60 * 1000 }
    }));


    // Index Route
    app.get("/", (req, res) => {
        if (req.session.loggedIn) {
            return res.redirect(`/dashboard/${req.session.username}`);
        }

        let data = {
            header: function () {
                return "index-header"
            }
        }

        // Password Recovery
        if (req.session.passwordReset) {
            data["recoverUser"] = req.session.passwordReset.recoverUser
            data["recoverToken"] = req.session.passwordReset.recoverToken
        }
        else if (req.session.invite) {
            data["invitecode"] = req.session.invite.token
        }
        else if (req.session.registerConfirm) {
            data['loginMessage'] = req.session.registerConfirm.message
        }

        req.session.destroy(() => {
            res.render("index", data);
        })

    })

    // Routes
    app.use('/', require('./router/login-register'));
    app.use('/', require('./router/dashboard'))
    app.use('/', require('./router/admin'))
    app.use('/', require('./router/steamaccount'))
    app.use('/', require('./router/steamaccounts'))
    app.use('/', require('./router/api'))

    // Redirect to index page undefined routes
    app.get('*', function (req, res) {
        res.redirect("/");
    });

    let server = app.listen(process.env.PORT || 8080, () => {
        console.log(` - HTTP Server running on port: ${process.env.PORT || 8080}`);
        // Start socket.io
        let io = require('socket.io')(server)
        module.exports.io = io;
    });
}
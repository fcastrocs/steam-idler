const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const bodyParser = require("body-parser");
const session = require('express-session');
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session);
const helmet = require('helmet')
const GetAndSaveProxies = require('./util/proxy').GetAndSaveProxies;
const GetAndSaveSteamCMs = require('./util/steamcm').GetAndSaveSteamCMs;
const AccountHandler = require("./account-handler");
const SteamAccount = require('./models/steam-accounts')
const ApiLimiter = require('./models/api-limiter')

// Handler must be kept in RAM at all times
let accountHandler = new AccountHandler();
module.exports = accountHandler;

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

    try {
        let res = await cleanup();
        console.log(res)
    } catch (error) {
        console.log(error);
        process.exit();
    }

    // Fetch proxies now, then every 40 minutes
    try {
        let res = await fetchProxies();
        console.log(res);
    } catch (error) {
        console.log(error);
    }
    setInterval(async () => {
        try {
            let res = await fetchProxies();
            console.log(res);
        } catch (error) {
            console.log(error);
        }
    }, 40 * 60 * 1000);

    // Initialize accounts in handlers
    try {
        await accountHandler.init();
    } catch (error) {
        console.log(error);
    }

    // Fetch Steam CM servers
    // try {
    //     let res = await GetAndSaveSteamCMs();
    //     console.log(res)
    // } catch (error) {
    //     console.log(error)
    //     return;
    // }

    // Initialize web
    initWeb();
})();

async function DBconnect() {
    try {
        mongoose.set('useCreateIndex', true);
        await mongoose.connect(process.env.MOGODB_URI, {
            useNewUrlParser: true,
            dbName: process.env.DATABASE,
            poolSize: 50,
            autoIndex: true
        })
        return Promise.resolve(' - connected to mongodb');
    } catch (error) {
        return Promise.reject(' - could not connect to mongodb');
    }
}

async function cleanup() {
    return new Promise(async (resolve, reject) => {
        try {
            // clean up accounts
            let change = {
                status: "Offline",
                lastHourReconnects: 0
            }
            await SteamAccount.updateMany({}, change).exec();

            //clean up api limiter
            await ApiLimiter.deleteMany({}).exec();
            return resolve(" - db cleaned up");
        } catch (error) {
            console.log(error)
            return reject(" - could not clean up db")
        }
    })
}

async function fetchProxies() {
    try {
        let res = await GetAndSaveProxies();
        return Promise.resolve(res);
    } catch (error) {
        return Promise.reject(error);
    }
}

function initWeb() {
    // Certificate
    const privateKey = fs.readFileSync('./ssl/private.key', 'utf8');
    const certificate = fs.readFileSync('./ssl/certificate.crt', 'utf8');
    const ca = fs.readFileSync('./ssl/ca_bundle.crt', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    // set HTTP headers appropriately to counter web vulnerabilities
    app.use(helmet())

    // public folder
    app.use('/static', express.static('web/public'))

    // Use body-parser
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // use Handlebars view engine
    app.engine('.hbs', exphbs({
        extname: '.hbs',
        layoutsDir: 'web/views/layouts',
        defaultLayout: 'main',
        partialsDir: "web/views/partials"
    }));
    app.set('view engine', '.hbs')
    app.set('views', "./web/views");

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
            return res.redirect(`/dashboard/${req.session.username}`);;
        }
        res.render('index', {
            header: function () {
                return "index-header"
            }
        });
    })

    // Routes
    app.use('/', require('./router/login-register'));
    app.use('/', require('./router/dashboard'))
    app.use('/', require('./router/admin'))
    app.use('/', require('./router/steamaccount'))
    app.use('/', require('./router/steamaccounts'))

    // Redirect to index page undefined routes
    app.get('*', function (req, res) {
        res.redirect("/");
    });


    //Start listening on port
    // Starting both http & https servers
    const httpServer = http.createServer(app);
    const httpsServer = https.createServer(credentials, app);

    httpServer.listen(process.env.HTTP_PORT, () => {
        console.log(' - HTTP Server running on port 8080');
    });

    httpsServer.listen(process.env.HTTPS_PORT, () => {
        console.log(' - HTTPS Server running on port 8443');
    });
}
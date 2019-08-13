const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require("body-parser");
const session = require('express-session');
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session);
const helmet = require('helmet')
const GetAndSaveProxies = require('./util/proxy').GetAndSaveProxies;
const GetAndSaveSteamCMs = require('./util/steamcm').GetAndSaveSteamCMs;
const AccountHandler = require("./account-handler");

// Handler must be kept in ram at all times
let accountHandler = new AccountHandler();
module.exports = accountHandler;

//Initialization process.
(async function () {
    //Connect database
    try {
        mongoose.set('useCreateIndex', true);
        await mongoose.connect(process.env.MOGODB_URI, { useNewUrlParser: true })
        console.log('Connected to MongoDB.');
    } catch (error) {
        console.log(error);
        return;
    }


    // Fetch Steam CM servers
    try {
        let res = await GetAndSaveSteamCMs();
        console.log(res)
    } catch (error) {
        console.log(error)
        return;
    }

    // Fetch proxies
    try {
        let res = await GetAndSaveProxies();
        console.log(res)
    } catch (error) {
        console.log(error)
        return;
    }

    //Initialize steam accounts
    try {
        await accountHandler.init();
    } catch (error) {
        console.log(error)
    }

})();

// Certificate
const privateKey = fs.readFileSync('./ssl/private.key', 'utf8');
const certificate = fs.readFileSync('./ssl/certificate.crt', 'utf8');
const ca = fs.readFileSync('./ssl/ca_bundle.crt', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

// Init express
const app = express();

// set HTTP headers appropriately to counter web vulnerabilities
app.use(helmet())

// public folder
app.use('/static', express.static('web/public'))

// Use body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use Handlebars view engine
app.set('views', "./web/views");
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: 'web/views/layouts'
}));
app.set('view engine', '.hbs')

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

// Routes
app.use('/', require('./router/login-register'));
app.use('/', require('./router/dashboard'))
app.use('/', require('./router/admin'))
app.use('/', require('./router/steamaccount'))

//Start listening on port
// Starting both http & https servers
const httpServer = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

httpServer.listen(process.env.HTTP_PORT, () => {
	console.log('HTTP Server running on port 8080');
});

// httpsServer.listen(process.env.HTTPS_PORT, () => {
// 	console.log('HTTPS Server running on port 8443');
// });
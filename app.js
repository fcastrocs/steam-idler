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

// Init steam account handler
module.exports = new AccountHandler();

// Init express
const app = express();
const port = process.env.PORT || 3000;

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
        touchAfter: 24 * 3600, // time period in seconds 
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    }),
    secret: "#$#$^*&GB4534fsgsdfg4352FSDF&^",
    resave: false, //don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    name: 'idlerSession',
    httpOnly: true
}));


// Routes
app.use('/', require('./router/login-register'));
app.use('/', require('./router/dashboard'))
app.use('/', require('./router/admin'))

//Start listening on port
app.listen(port, () => console.log(`steam-farmer started on port ${port}\n`));

// Connect to db
const DBURL = 'mongodb://machi:chivas10@ds033056.mlab.com:33056/heroku_z7f42pmp';
mongoose.set('useCreateIndex', true);

mongoose.connect(DBURL, { useNewUrlParser: true }).then(async function () {
    process.env.dbconnected = true;
    console.log('Connected to database');

    try {
        let res = await GetAndSaveSteamCMs();
        console.log(res)
        res = await GetAndSaveProxies();
        console.log(res)
    } catch (error) {
        console.log(error)
    }
}).catch(err => console.log('error connecting to mongodb'));


var http = require("http");
setInterval(function () {
    http.get("https://steam-farmer.herokuapp.com");
}, 300000); // every 5 min
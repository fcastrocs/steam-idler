const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require("body-parser");
const session = require('express-session');
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session);
const helmet = require('helmet')

// Init app
const app = express(); 
const port = process.env.PORT || 3000;

app.use(helmet())

// public folder
app.use('/public', express.static(path.join(__dirname, 'public')))

// Use body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use Handlebars view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs')

// Set up sessions
app.use(session({
	store: new MongoStore({ mongooseConnection: mongoose.connection }),
    secret: "#$#$^*&GBFSDF&^",
    resave: false,
    saveUninitialized: false,
    name: 'farmSessionId',
    httpOnly: true
}));


// Routes
app.use('/', require('./router/login-register'));
app.use('/', require('./router/dashboard'))
app.use('/', require('./router/steam-accounts'))


app.listen(port, () =>{
    console.log(`steam-farmer started on port ${port}`);

    //connect to db
    const DBURL = 'mongodb://machi:chivas10@ds033056.mlab.com:33056/heroku_z7f42pmp';
    mongoose.set('useCreateIndex', true);
    mongoose.connect(DBURL, { useNewUrlParser: true })
    .then(() =>{
        console.log("connected to mongodb")
    })
    .catch(err=>{
        console.log('error connecting to mongodb')
    })
});
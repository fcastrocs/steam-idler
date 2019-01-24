const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require("body-parser");

// Init app
const app = express(); 
const port = process.env.PORT || 3000;


// -- MIDDLEWARES -- //

// public folder
app.use('/public', express.static(path.join(__dirname, 'public')))
// Use body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use Handlebars view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs')


// -- ROUTERS -- //
// Main page
app.get("/", (req, res) =>{
    res.render('index');
});

app.listen(port, () => console.log(`server started on port ${port}`))
/*
    Initializes working path and creates required folders to save results.
    Sets appdata folder to save settings.
*/

"use strict";

// Initializations
const moment = require("moment");
const mkdirp = require("mkdirp");
const fs = require("fs");

//Get current date
let date = moment().format('MMM D (h;mm a)');
process.env.date = date;

// Set working path
process.env.workingPath = process.env['USERPROFILE'] + `/Desktop/Results/${date}`;

// Create all needed folders
let workingPath = process.env.workingPath;
mkdirp(`${workingPath}/hits`, (err) =>{
    if(err){
        fs.writeFileSync(`${path}/errors.txt`, err);
    }
});

mkdirp(`${workingPath}/diff-email`, (err) =>{
    if(err){
        fs.writeFileSync(`${path}/errors.txt`, err);
    }
});

// create appdata folder to save config
mkdirp(`${process.env.APPDATA}/steam-checker`, (err) =>{
    if(err){
        fs.writeFileSync(`${path}/errors.txt`, err);
    }
});
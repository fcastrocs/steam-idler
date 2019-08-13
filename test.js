const mongoose = require('mongoose')
const User = require('./models/user');

async function hi() {


    let MOGODB_URI = "mongodb+srv://machi:EP9rlbt0kJtZzCr9@steamidler-m2wnc.gcp.mongodb.net"
    mongoose.set('useCreateIndex', true);

    await mongoose.connect(MOGODB_URI, {
        useNewUrlParser: true,
        dbName: 'steamidler',
        poolSize: 20,
        autoIndex: false,
    })


 // find user
 let query = User.findOne({ username: "machiavelli" })
 let doc = await query.exec();

 console.log(doc)


}

hi();
const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs');
    SALT_WORK_FACTOR = 10;

let user = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 5, maxlength: 20},
    admin: {type: Boolean, default: false}
});

// Hash password before saving
user.pre('save', function(next){
    let user = this;
    bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) =>{
        if(err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) =>{
            if(err) return next(err);
             // override the cleartext password with the hashed one
            user.password = hash;
            next();
        })
    })
})

// Compare post password and db password
user.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', user);
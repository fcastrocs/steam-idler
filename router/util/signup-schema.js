const Joi = require("@hapi/joi")

const signup = Joi.object().keys({
    username: Joi.string().lowercase().trim().alphanum().min(3).max(15).required().error(() => {
        return "Username must be:<br>\
        • At least 3 characters long to a maximum of 15 characters.<br>\
        • Must be alphanumeric."
    }),
    password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/).error(() => {
        return "Password must be:<br>\
        • At least 8 characters long to a maximum of 15 characters.<br>\
        • At least one letter in upper Case.<br>\
        • At least one letter in lower Case.<br>\
        • At least 1 special character.<br>\
        • At least 1 numeral."
    }),
    email: Joi.string().email({ minDomainSegments: 2 }).error(errors => {
        return "Bad email address.\n";
    }),
}).optionalKeys("username", "email")
module.exports = signup;
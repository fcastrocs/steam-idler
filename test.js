const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

module.exports.sendVerification = (url, username, email) =>{
    msg = {
        to: email,
        from: 'no-reply@steamidler.online',
        subject: 'Account verification - Steam Idler/Farmer by Machiavelli',
        text: `Hello ${username}\nPlease confirm your account:\n\n`,
        html: "<div><a href="url"><strong>Click here</strong></a></div>",
    };
    sgMail.send(msg);
}
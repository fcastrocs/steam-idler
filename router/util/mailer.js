const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

module.exports.sendVerification = (url, username, email) => {
    return new Promise((resolve, reject) => {
        msg = {
            to: email,
            from: 'no-reply@steamidler.online',
            subject: 'Account verification - Steam Idler/Farmer by Machiavelli',
            text: `Hello ${username}, please confirm your account.`,
            html: `<div><a href="${url}"><strong>Verify Account</strong></a></div>`,
        };
        sgMail.send(msg, err => {
            if (err) {
                return reject("Could not send verification email.")
            }
            return resolve("Verification email sent.")
        });
    })
}


module.exports.sendInvite = (url, email) => {
    return new Promise((resolve, reject) => {
        msg = {
            to: email,
            from: 'no-reply@steamidler.online',
            subject: 'Invite - Steam Idler/Farmer by Machiavelli',
            text: `Hello, you've been invited to Steam Idler/Farmer by Machiavelli`,
            html: `<div><a href="${url}"><strong>Invite link</strong></a></div>`,
        };
        sgMail.send(msg, err => {
            if (err) {
                return reject("Could not send invite email.")
            }
            return resolve("Invite email sent.")
        });
    })
}

module.exports.sendRecovery = (url, email) => {
    return new Promise((resolve, reject) => {
        msg = {
            to: email,
            from: 'no-reply@steamidler.online',
            subject: 'Recovery - Steam Idler/Farmer by Machiavelli',
            text: `Hello, here's your recovery link.`,
            html: `<div><a href="${url}"><strong>Recovery link</strong></a></div>`,
        };
        sgMail.send(msg, err => {
            if (err) {
                return reject("Could not send recovery link.")
            }
            return resolve("Recovery link email sent.")
        });
    })
}
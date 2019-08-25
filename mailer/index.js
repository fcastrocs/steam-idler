const mailgun = require("mailgun-js");
const DOMAIN = "steamidler.com";
const mg = mailgun({ apiKey: process.env.MAILGUN_KEY, domain: DOMAIN });

module.exports.sendInvite = (url, email) => {
    const data = {
        from: "Steamidler.com <noreply@steamidler.com>",
        to: email,
        subject: "You've received an invite.",
        template: "invitation",
        'h:X-Mailgun-Variables': `{ "action_url": "${url}" }`
    };
    return sendEmail(data);
}

module.exports.sendEmailConfirm = (url, email) => {
    const data = {
        from: "Steamidler.com <noreply@steamidler.com>",
        to: email,
        subject: "Confirm your email.",
        template: "confirmemail",
        'h:X-Mailgun-Variables': `{ "action_url": "${url}" }`
    };
    return sendEmail(data);
}

module.exports.sendRecovery = (url, email) => {
    const data = {
        from: "Steamidler.com <noreply@steamidler.com>",
        to: email,
        subject: "Recover Your Account.",
        template: "forgotpassword",
        'h:X-Mailgun-Variables': `{ "action_url": "${url}" }`
    };
    return sendEmail(data);
}

async function sendEmail(data) {
    try {
        let res = await mg.messages().send(data);
        return Promise.resolve(res);
    } catch (error) {
        return Promise.reject(error);
    }
}
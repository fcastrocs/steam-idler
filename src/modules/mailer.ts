import mailgun from "mailgun-js";
const mg = mailgun({ apiKey: process.env.MAILGUN_KEY, domain: process.env.DOMAIN });

function sendInvite(url: string, email: string) {
  const data: mailgun.messages.SendTemplateData = {
    from: "Steamidler.com <noreply@steamidler.com>",
    to: email,
    subject: "You've received an invite.",
    template: "invitation",
    "h:X-Mailgun-Variables": `{ "action_url": "${url}" }`,
  };
  return sendEmail(data);
}

function sendEmailConfirm(url: string, email: string) {
  const data: mailgun.messages.SendTemplateData = {
    from: "Steamidler.com <noreply@steamidler.com>",
    to: email,
    subject: "Confirm your email.",
    template: "confirmemail",
    "h:X-Mailgun-Variables": `{ "action_url": "${url}" }`,
  };
  return sendEmail(data);
}

function sendRecovery(url: string, doc: any) {
  const data: mailgun.messages.SendTemplateData = {
    from: "Steamidler.com <noreply@steamidler.com>",
    to: doc.email,
    subject: "Recover Your Account.",
    template: "forgotpassword",
    "h:X-Mailgun-Variables": `{ "username": "${doc.username}", "action_url": "${url}" }`,
  };
  return sendEmail(data);
}

async function sendEmail(data: mailgun.messages.SendTemplateData) {
  try {
    let res = await mg.messages().send(data);
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
}

module.exports = { sendInvite, sendEmailConfirm, sendRecovery, sendEmail };

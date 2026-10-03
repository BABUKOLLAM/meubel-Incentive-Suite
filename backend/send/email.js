// Email through SMTP (SMTP_URL, e.g. smtps://user:pass@smtp.example.com:465) with MAIL_FROM as the sender.
const nodemailer = require('nodemailer');
let transport = null;
function configured() { return !!(process.env.SMTP_URL && process.env.MAIL_FROM); }
function tx() { if (!transport) transport = nodemailer.createTransport(process.env.SMTP_URL); return transport; }
async function send(to, subject, html, text, cc) {
  if (!configured()) throw new Error('Email not configured (SMTP_URL, MAIL_FROM)');
  const info = await tx().sendMail({ from: process.env.MAIL_FROM, to, cc, subject, html, text });
  return { id: info.messageId };
}
module.exports = { send, configured };

import nodemailer from 'nodemailer';
import { business } from '../shared/business.js';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);

const transporter = host
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

export const mailEnabled = Boolean(transporter);
export const ownerEmail = process.env.NOTIFY_EMAIL || business.email;

const from =
  process.env.MAIL_FROM || `"${business.name}" <${process.env.SMTP_USER || business.email}>`;

export async function sendMail({ to, subject, text, replyTo }) {
  if (!transporter) {
    console.log(
      `\n──── email (SMTP not configured, printing instead) ────\nTo: ${to}\nSubject: ${subject}\n\n${text}\n────────────────────────────────────────────────────────\n`,
    );
    return;
  }
  await transporter.sendMail({ from, to, subject, text, replyTo });
}

/** Fire-and-forget: an email problem must never break a booking. */
export function sendMailSafely(message) {
  sendMail(message).catch((err) => console.error(`Email to ${message.to} failed: ${err.message}`));
}

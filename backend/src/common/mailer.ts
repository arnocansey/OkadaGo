import nodemailer from "nodemailer";
import { appConfig } from "./config.js";

function hasSmtpConfig() {
  return Boolean(
    appConfig.smtpHost &&
      appConfig.smtpPort &&
      appConfig.smtpUser &&
      appConfig.smtpPass &&
      appConfig.smtpFrom
  );
}

export async function sendOtpEmail({
  to,
  code,
  contactName
}: {
  to: string;
  code: string;
  contactName: string;
}) {
  if (!hasSmtpConfig()) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.");
  }

  const transporter = nodemailer.createTransport({
    host: appConfig.smtpHost,
    port: appConfig.smtpPort,
    secure: appConfig.smtpSecure,
    auth: {
      user: appConfig.smtpUser,
      pass: appConfig.smtpPass
    }
  });

  await transporter.sendMail({
    from: appConfig.smtpFrom,
    to,
    subject: "OkadaGo trusted contact verification code",
    text: `Use this OTP to verify ${contactName}: ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2 style="margin:0 0 12px">OkadaGo trusted contact verification</h2>
        <p>Use this code to verify <strong>${contactName}</strong>:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:10px 0">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
}


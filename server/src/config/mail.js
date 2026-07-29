import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const mailFrom = process.env.SMTP_FROM || process.env.SMTP_USER
export const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL

export default transporter

import dotenv from 'dotenv'
dotenv.config()
export const MAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST,
  GOOGLE_GMAIL: process.env.GOOGLE_GMAIL,
  GOOGLE_KEY: process.env.GOOGLE_KEY
}

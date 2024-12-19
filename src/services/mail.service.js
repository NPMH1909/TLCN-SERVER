import { MAIL_CONFIG } from '../configs/mail.config.js'
import nodemailer from 'nodemailer'
import { createApiKey } from '../middlewares/useApiKey.middleware.js'
import { UserModel } from '../models/users.model.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { NotFoundError } from '../errors/notFound.error.js'
const transporter = nodemailer.createTransport({
  port: 465,
  host: MAIL_CONFIG.SMTP_HOST,
  auth: {
    user: MAIL_CONFIG.GOOGLE_GMAIL,
    pass: MAIL_CONFIG.GOOGLE_KEY
  },
  secure: true
})
const sendMail = ({ to, subject, html }) => {
  const mailData = {
    from: 'Mindx Restaurant',
    to,
    subject,
    html
  }
  transporter.sendMail(mailData, (err, info) => {
    if (err) {
      return err
    } else {
      return info.messageId
    }
  })
}

const sendResetPasswordMail = async (to) => {
  const user = await UserModel.find({ email: to }).orFail(new NotFoundError('User not found'))
  const code = createApiKey({ id: user[0]._id, email: user[0].email })
  const subject = 'Mail reset mật khẩu của bạn'
  const html = `<h1>Mã reset mật khẩu của bạn</h1><p>Mã của bạn là: <strong>${code}</strong></p>`
  transporter.sendMail({ to, subject, html }, (err, info) => {
    if (err) {
      throw err
    } else {
      return info.messageId
    }
  })
}

export const MailService = { sendMail, sendResetPasswordMail }

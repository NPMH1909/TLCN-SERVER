import { MAIL_CONFIG } from '../configs/mail.config.js'
import nodemailer from 'nodemailer'
import { generateOtp } from '../middlewares/useApiKey.middleware.js'
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
  secure: true,
  tls: {
    rejectUnauthorized: false, // Debug: Chấp nhận chứng chỉ không hợp lệ
  },

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
  const user = await UserModel.findOne({ email: to }).orFail(new NotFoundError('User not found'));
  
  const otp = generateOtp(); // Tạo OTP
  const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP có hiệu lực trong 15 phút

  // Lưu OTP và thời gian hết hạn vào cơ sở dữ liệu
  await UserModel.findByIdAndUpdate(user._id, { otp });

  const subject = 'Mã xác thực để reset mật khẩu của bạn';
  const html = `<h1>Mã xác thực reset mật khẩu</h1><p>Mã của bạn là: <strong>${otp}</strong></p><p>OTP sẽ hết hạn sau 15 phút.</p>`;
  
  transporter.sendMail({ to, subject, html }, (err, info) => {
    if (err) {
      throw err;
    } else {
      return info.messageId;
    }
  });
};


export const MailService = { sendMail, sendResetPasswordMail }

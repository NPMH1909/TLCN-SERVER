import { MAIL_CONFIG } from '../configs/mail.config.js'
import nodemailer from 'nodemailer'
import { generateOtp } from '../middlewares/useApiKey.middleware.js'
import { UserModel } from '../models/users.model.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { NotFoundError } from '../errors/notFound.error.js'
import cron from 'node-cron';
import { OrderService } from './order.service.js'
import { OrderModel } from '../models/orders.model.js'

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
// const sendMail = ({ to, subject, html }) => {
//   const mailData = {
//     from: 'Mindx Restaurant',
//     to,
//     subject,
//     html
//   }
//   transporter.sendMail(mailData, (err, info) => {
//     if (err) {
//       return err
//     } else {
//       return info.messageId
//     }
//   })
// }
const sendMail = async ({ to, subject, html }) => {
  const mailData = {
    from: 'Mindx Restaurant',
    to,
    subject,
    html
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailData, (err, info) => {
      if (err) {
        reject(err); // Nếu lỗi, trả về lỗi
      } else {
        resolve(info.messageId); // Trả về messageId của email
      }
    });
  });
};

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

cron.schedule("*/600 * * * *", async () => {
  console.log("🔎 Kiểm tra đặt bàn gần đến giờ...");
  const bookings = await OrderService.getUpcomingBookings();
  if (bookings.length === 0) return; // Không có đặt bàn thì bỏ qua

  for (const booking of bookings) {
    const restaurantName = booking.restaurant_id.name || "Nhà hàng";
    const bookingTime = new Date(booking.checkin);

    bookingTime.setHours(bookingTime.getHours() - 7); // Cộng thêm 7 giờ

    const formattedTime = bookingTime.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const message = `
      Xin chào ${booking.name},

      Bạn có đặt bàn tại **${restaurantName}** vào lúc ${formattedTime}.
      Vui lòng đến đúng giờ!

      Cảm ơn bạn đã sử dụng dịch vụ!
    `;

    try {
      const result = await sendMail({
        to: booking.email,
        subject: `📅 Nhắc nhở đặt bàn tại ${restaurantName}`,
        html: message
      });
      console.log("📩 Email gửi thành công:", result);
      await OrderModel.updateOne({ _id: booking._id }, { $set: { reminder_sent: true } });

    } catch (error) {
      console.error("❌ Lỗi khi gửi email:", error);
    }
  }
});

export const MailService = { sendMail, sendResetPasswordMail }

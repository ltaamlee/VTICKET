const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  /**
   * Send OTP verification email
   * @param {string} toEmail 
   * @param {string} otp 
   * @param {string} fullName 
   */
  async sendOtpEmail(toEmail, otp, fullName = 'Quý khách') {
    const subject = '[VTicket] Mã xác thực đăng ký tài khoản';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #4F46E5; text-align: center;">VTicket - Nền Tảng Vé Điện Tử</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại VTicket. Mã xác thực (OTP) của bạn là:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2FF; padding: 10px 24px; border-radius: 6px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Đội ngũ hỗ trợ VTicket</p>
      </div>
    `;

    console.log(`[Email Service] OTP sent to ${toEmail}: ${otp} (Expires in 5 minutes)`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"VTicket Support" <${process.env.EMAIL_USER}>`,
          to: toEmail,
          subject,
          html: htmlContent,
        });
      } catch (error) {
        console.error('Error sending email via SMTP:', error.message);
      }
    }
  }
}

module.exports = new EmailService();

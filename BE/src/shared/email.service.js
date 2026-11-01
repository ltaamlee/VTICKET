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

  /**
   * Send OTP email for forgot/reset password
   * @param {string} toEmail 
   * @param {string} otp 
   * @param {string} fullName 
   */
  async sendForgotPasswordEmail(toEmail, otp, fullName = 'Quý khách') {
    const subject = '[VTicket] Mã xác thực đặt lại mật khẩu';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #4F46E5; text-align: center;">VTicket - Nền Tảng Vé Điện Tử</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản VTicket của bạn.</p>
        <p>Mã xác thực (OTP) của bạn là:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #DC2626; background-color: #FEF2F2; padding: 10px 24px; border-radius: 6px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        <p style="color: #6B7280; font-size: 14px;">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và mật khẩu của bạn vẫn được giữ nguyên an toàn.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Đội ngũ hỗ trợ VTicket</p>
      </div>
    `;

    console.log(`[Email Service] Forgot password OTP sent to ${toEmail}: ${otp} (Expires in 5 minutes)`);

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

  /**
   * Send notification email when organizer request is approved
   * @param {string} toEmail 
   * @param {string} organizationName 
   * @param {string} fullName 
   */
  async sendOrganizerApprovedEmail(toEmail, organizationName, fullName = 'Quý khách') {
    const subject = '[VTicket] Chúc mừng! Yêu cầu đăng ký Ban Tổ Chức đã được phê duyệt';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #10B981; text-align: center;">VTicket - Chúc Mừng Bạn!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi vui mừng thông báo rằng yêu cầu đăng ký trở thành <strong>Ban Tổ Chức</strong> của bạn cho đơn vị <strong>${organizationName}</strong> đã được Quản trị viên VTicket <strong>phê duyệt thành công</strong>.</p>
        <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #065F46; font-weight: bold;">Tài khoản của bạn hiện đã được nâng cấp quyền ORGANIZER.</p>
          <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">Bạn có thể bắt đầu đăng tải sự kiện, quản lý vé và sơ đồ chỗ ngồi ngay bây giờ.</p>
        </div>
        <p style="color: #4B5563; font-size: 14px;">Vui lòng đăng nhập lại vào hệ thống VTicket để trải nghiệm bảng điều khiển dành riêng cho Ban Tổ Chức.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Đội ngũ hỗ trợ đối tác VTicket</p>
      </div>
    `;

    console.log(`[Email Service] Organizer Approval Email sent to ${toEmail}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"VTicket Support" <${process.env.EMAIL_USER}>`,
          to: toEmail,
          subject,
          html: htmlContent,
        });
      } catch (error) {
        console.error('Error sending organizer approval email:', error.message);
      }
    }
  }

  /**
   * Send notification email when organizer request is rejected
   * @param {string} toEmail 
   * @param {string} organizationName 
   * @param {string} fullName 
   * @param {string} rejectReason 
   */
  async sendOrganizerRejectedEmail(toEmail, organizationName, fullName = 'Quý khách', rejectReason = '') {
    const subject = '[VTicket] Thông báo về yêu cầu đăng ký Ban Tổ Chức';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #EF4444; text-align: center;">VTicket - Thông Báo Xét Duyệt</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã quan tâm và gửi yêu cầu đăng ký trở thành <strong>Ban Tổ Chức</strong> tại VTicket cho đơn vị <strong>${organizationName}</strong>.</p>
        <p>Sau khi xem xét hồ sơ, chúng tôi rất tiếc phải thông báo rằng yêu cầu của bạn <strong>chưa được phê duyệt</strong> vào thời điểm này.</p>
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991B1B; font-weight: bold;">Lý do từ chối:</p>
          <p style="margin: 8px 0 0 0; color: #B91C1C; font-size: 14px;">${rejectReason || 'Hồ sơ cung cấp chưa đủ thông tin hoặc chưa đáp ứng tiêu chuẩn của VTicket.'}</p>
        </div>
        <p style="color: #4B5563; font-size: 14px;">Bạn có thể cập nhật lại thông tin hồ sơ và gửi lại yêu cầu mới trên trang cá nhân của mình.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Đội ngũ hỗ trợ đối tác VTicket</p>
      </div>
    `;

    console.log(`[Email Service] Organizer Rejection Email sent to ${toEmail}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"VTicket Support" <${process.env.EMAIL_USER}>`,
          to: toEmail,
          subject,
          html: htmlContent,
        });
      } catch (error) {
        console.error('Error sending organizer rejection email:', error.message);
      }
    }
  }
}

module.exports = new EmailService();

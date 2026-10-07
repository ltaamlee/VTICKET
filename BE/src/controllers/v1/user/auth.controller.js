const authService = require('../../../services/user/auth.service');
const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');

class AuthController {
  constructor(service = authService) {
    this.authService = service;
  }

  /**
   * Handle user registration
   */
  register = asyncHandler(async (req, res) => {
    const result = await this.authService.register(req.body);
    return sendResponse(res, 201, 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực mã OTP', result);
  });

  /**
   * Handle OTP verification
   */
  verifyOtp = asyncHandler(async (req, res) => {
    await this.authService.verifyOtp(req.body.email, req.body.otp);
    return sendResponse(res, 200, 'Kích hoạt tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ');
  });

  /**
   * Handle resend OTP request
   */
  resendOtp = asyncHandler(async (req, res) => {
    const result = await this.authService.resendOtp(req.body.email);
    return sendResponse(res, 200, 'Gửi lại mã OTP thành công', result);
  });

  /**
   * Handle user login request
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    return sendResponse(res, 200, 'Đăng nhập thành công', result);
  });

  /**
   * Get authenticated user profile info
   */
  getMe = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.authService.getProfile(userId);
    return sendResponse(res, 200, 'Lấy thông tin người dùng thành công', result);
  });
}

module.exports = new AuthController();

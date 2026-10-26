const userService = require('../../../services/user/user.service');
const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');
const { BadRequestException } = require('../../../exceptions');

class UserController {
  constructor(service = userService) {
    this.userService = service;
  }

  /**
   * Get current authenticated user's profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.userService.getProfile(userId);
    return sendResponse(res, 200, 'Lấy thông tin người dùng thành công', result);
  });

  /**
   * Update current authenticated user's profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.userService.updateProfile(userId, req.body);
    return sendResponse(res, 200, 'Cập nhật thông tin cá nhân thành công', result);
  });

  /**
   * Change password for current authenticated user
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const result = await this.userService.changePassword(userId, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return sendResponse(res, 200, 'Đổi mật khẩu thành công', result);
  });

  /**
   * Upload user avatar to Cloudinary and update profile
   */
  uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    if (!req.file) {
      throw new BadRequestException('Vui lòng chọn hình ảnh để tải lên');
    }
    const result = await this.userService.updateAvatar(userId, req.file.buffer);
    return sendResponse(res, 200, 'Cập nhật ảnh đại diện thành công', result);
  });
}

module.exports = new UserController();

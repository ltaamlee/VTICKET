const userService = require('../../../services/user/user.service');
const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');

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
}

module.exports = new UserController();

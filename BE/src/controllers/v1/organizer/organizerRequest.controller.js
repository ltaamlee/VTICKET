const organizerRequestService = require('../../../services/organizer/organizerRequest.service');
const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');

class OrganizerRequestController {
  constructor(service = organizerRequestService) {
    this.service = service;
  }

  /**
   * User submits an organizer registration request
   */
  createRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.createRequest(userId, req.body);
    return sendResponse(
      res,
      201,
      'Gửi yêu cầu đăng ký làm Ban Tổ Chức thành công. Vui lòng chờ phản hồi xét duyệt.',
      result
    );
  });

  /**
   * User views their current organizer status and latest request
   */
  getMyRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.getMyRequest(userId);
    return sendResponse(res, 200, 'Lấy thông tin đơn đăng ký thành công', result);
  });

  /**
   * User updates their request while it is PENDING
   */
  updateMyRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await this.service.updateMyRequest(userId, id, req.body);
    return sendResponse(res, 200, 'Cập nhật đơn đăng ký thành công', result);
  });

  /**
   * User cancels their PENDING request
   */
  cancelMyRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await this.service.cancelMyRequest(userId, id);
    return sendResponse(res, 200, result.message, null);
  });
}

module.exports = new OrganizerRequestController();

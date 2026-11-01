const adminOrganizerRequestService = require('../../../services/admin/adminOrganizerRequest.service');
const asyncHandler = require('../../../utils/asyncHandler');
const sendResponse = require('../../../utils/sendResponse');

class AdminOrganizerRequestController {
  constructor(service = adminOrganizerRequestService) {
    this.service = service;
  }

  /**
   * Get list of requests with filter & pagination
   */
  getRequests = asyncHandler(async (req, res) => {
    const { page, limit, status, keyword } = req.query;
    const result = await this.service.getRequests({ page, limit, status, keyword });
    return sendResponse(res, 200, 'Lấy danh sách đơn đăng ký Ban Tổ Chức thành công', result);
  });

  /**
   * Get stats of requests (pending, approved, rejected, total)
   */
  getStats = asyncHandler(async (req, res) => {
    const result = await this.service.getOrganizerStats();
    return sendResponse(res, 200, 'Lấy thống kê đơn đăng ký thành công', result);
  });

  /**
   * Get single request detail
   */
  getRequestDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.getRequestDetail(id);
    return sendResponse(res, 200, 'Lấy chi tiết đơn đăng ký thành công', result);
  });

  /**
   * Approve request
   */
  approveRequest = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params;
    const result = await this.service.approveRequest(id, adminId);
    return sendResponse(
      res,
      200,
      'Phê duyệt đơn đăng ký thành công. Tài khoản đã được nâng cấp lên Ban Tổ Chức.',
      result
    );
  });

  /**
   * Reject request
   */
  rejectRequest = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params;
    const { rejectReason } = req.body;
    const result = await this.service.rejectRequest(id, adminId, { rejectReason });
    return sendResponse(res, 200, 'Từ chối đơn đăng ký thành công', result);
  });
}

module.exports = new AdminOrganizerRequestController();

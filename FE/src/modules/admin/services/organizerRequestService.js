import { apiRequest } from "../../../services/api";

/**
 * Lấy số lượng thống kê đơn đăng ký Ban Tổ Chức (total, pending, approved, rejected, cancelled)
 */
export function getOrganizerRequestStats() {
  return apiRequest("/admin/organizer-requests/stats", {
    method: "GET",
  });
}

/**
 * Lấy danh sách đơn đăng ký Ban Tổ Chức (có phân trang, tìm kiếm, lọc trạng thái)
 * @param {Object} options { page, limit, status, keyword }
 */
export function getOrganizerRequests({ page = 1, limit = 10, status = "", keyword = "" } = {}) {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (status) params.append("status", status);
  if (keyword) params.append("keyword", keyword);

  return apiRequest(`/admin/organizer-requests?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Lấy chi tiết đơn đăng ký theo ID
 * @param {string} id 
 */
export function getOrganizerRequestById(id) {
  return apiRequest(`/admin/organizer-requests/${id}`, {
    method: "GET",
  });
}

/**
 * Phê duyệt đơn đăng ký BTC (nâng role User thành ORGANIZER, tạo profile BTC)
 * @param {string} id 
 */
export function approveOrganizerRequest(id) {
  return apiRequest(`/admin/organizer-requests/${id}/approve`, {
    method: "PUT",
  });
}

/**
 * Từ chối đơn đăng ký BTC (kèm lý do giải thích gửi qua email)
 * @param {string} id 
 * @param {string} rejectReason 
 */
export function rejectOrganizerRequest(id, rejectReason) {
  return apiRequest(`/admin/organizer-requests/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectReason }),
  });
}

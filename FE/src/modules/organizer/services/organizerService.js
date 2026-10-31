import { apiRequest } from "../../../services/api";

/**
 * Gửi đơn đăng ký làm Ban Tổ Chức
 * @param {Object} data - Thông tin đăng ký
 */
export function registerOrganizer(data) {
  return apiRequest("/organizer/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Lấy thông tin đơn đăng ký và hồ sơ BTC hiện tại của tài khoản
 */
export function getMyOrganizerRequest() {
  return apiRequest("/organizer/my-request", {
    method: "GET",
  });
}

/**
 * Chỉnh sửa đơn đăng ký khi đang chờ duyệt (PENDING)
 * @param {string} id - ID đơn đăng ký
 * @param {Object} data - Dữ liệu cập nhật
 */
export function updateOrganizerRequest(id, data) {
  return apiRequest(`/organizer/my-request/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Hủy đơn đăng ký làm BTC (PENDING)
 * @param {string} id - ID đơn đăng ký
 */
export function cancelOrganizerRequest(id) {
  return apiRequest(`/organizer/my-request/${id}`, {
    method: "DELETE",
  });
}

/**
 * Upload giấy tờ xác minh / CCCD / Giấy phép kinh doanh lên Cloudinary
 * @param {File} file - File ảnh từ thiết bị
 * @param {string} folder - Thư mục trên Cloudinary
 */
export function uploadVerificationDocument(file, folder = "vticket/organizer-documents") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return apiRequest("/upload/image", {
    method: "POST",
    body: formData,
  });
}

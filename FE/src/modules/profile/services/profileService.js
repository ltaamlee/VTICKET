import { apiRequest } from "../../../services/api";

/**
 * Lấy thông tin cá nhân của người dùng hiện tại
 */
export function getProfile() {
  return apiRequest("/users/profile", {
    method: "GET",
  });
}

/**
 * Cập nhật thông tin cá nhân
 * @param {Object} data { fullName, phone, dob, avatar }
 */
export function updateProfile(data) {
  return apiRequest("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Đổi mật khẩu cho người dùng đang đăng nhập (không cần OTP)
 * @param {Object} data { currentPassword, newPassword, confirmPassword }
 */
export function changePassword(data) {
  return apiRequest("/users/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Tải ảnh đại diện lên Cloudinary và cập nhật hồ sơ người dùng
 * @param {File} file - File ảnh từ máy tính
 */
export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiRequest("/users/avatar", {
    method: "POST",
    body: formData,
  });
}

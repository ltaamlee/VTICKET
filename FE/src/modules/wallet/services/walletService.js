import { apiRequest } from "../../../services/api";

/**
 * Service API cho ví điện tử (e-wallet) của khách hàng.
 */

/**
 * Lấy thông tin ví + tài khoản liên kết + lịch sử giao dịch
 * @param {Object} queryParams - { page, pageSize }
 */
export function getWalletOverview(queryParams = {}) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/wallet?${queryString}` : "/wallet";

    return apiRequest(endpoint, { method: "GET" });
}

/**
 * Danh sách tài khoản thanh toán đã liên kết
 */
export function listWalletAccounts() {
    return apiRequest("/wallet/accounts", { method: "GET" });
}

/**
 * Danh sách nhà cung cấp ví được hỗ trợ (MoMo, VNPay, PayOS...)
 */
export function listWalletProviders() {
    return apiRequest("/wallet/providers", { method: "GET" });
}

/**
 * Liên kết tài khoản thanh toán vào ví
 * @param {Object} payload - { provider, identifier, nickname, isDefault }
 */
export function linkWalletAccount(payload) {
    return apiRequest("/wallet/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Đặt tài khoản làm mặc định
 * @param {string} id
 */
export function setDefaultWalletAccount(id) {
    return apiRequest(`/wallet/accounts/${encodeURIComponent(id)}/default`, {
        method: "POST",
    });
}

/**
 * Gỡ liên kết tài khoản
 * @param {string} id
 */
export function unlinkWalletAccount(id) {
    return apiRequest(`/wallet/accounts/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
}

/**
 * Nạp tiền vào ví từ tài khoản liên kết
 * @param {Object} payload - { accountId, amount, transactionRef }
 */
export function topUpWallet(payload) {
    return apiRequest("/wallet/topup", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Rút tiền từ ví về tài khoản đã liên kết
 * @param {Object} payload - { accountId, amount, note }
 */
export function withdrawWallet(payload) {
    return apiRequest("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

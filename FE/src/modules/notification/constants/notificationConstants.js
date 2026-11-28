/**
 * Hằng số dùng chung cho hệ thống thông báo.
 *
 * KHÔNG có danh mục loại thông báo cố định trong cấu hình hệ thống.
 * `type` của thông báo là chuỗi tự do, gửi từ BE; bảng dưới đây chỉ là
 * ánh xạ icon/màu cho các loại đang dùng. Loại mới sẽ tự dùng icon,
 * màu mặc định nếu chưa được khai báo ở đây.
 */

import {
    UserPlus,
    ShieldAlert,
    CalendarDays,
    CreditCard,
    Ticket,
    ScanLine,
    Repeat2,
    Wallet,
    Building2,
    Bell,
} from "lucide-react";

/**
 * Kênh thông báo (phần cơ bản duy nhất cấu hình được trong System Setting).
 */
export const NOTIFICATION_CHANNELS = [
    {
        key: "email",
        name: "Email",
        description: "Gửi thông báo đến địa chỉ email của người dùng.",
        icon: "Mail",
    },
    {
        key: "inApp",
        name: "Thông báo trong hệ thống",
        description: "Hiển thị thông báo trực tiếp trên website VTICKET (realtime).",
        icon: "Bell",
    },
];

/**
 * Icon tương ứng với từng loại thông báo (hiển thị trong chuông thông báo).
 */
export const NOTIFICATION_TYPE_ICONS = {
    ACCOUNT_REGISTRATION: UserPlus,
    SECURITY_ALERT: ShieldAlert,
    EVENT_UPDATE: CalendarDays,
    EVENT_APPROVED: CalendarDays,
    EVENT_REJECTED: CalendarDays,
    PAYMENT_SUCCESS: CreditCard,
    PAYMENT_FAILED: CreditCard,
    REFUND: CreditCard,
    TICKET_ISSUED: Ticket,
    CHECK_IN: ScanLine,
    RESALE_CREATED: Repeat2,
    RESALE_SOLD: Repeat2,
    RESALE_PAYMENT_SUCCESS: Repeat2,
    RESALE_CANCELLED: Repeat2,
    WALLET_TOPUP: Wallet,
    WALLET_WITHDRAW: Wallet,
    WALLET_PAYMENT: Wallet,
    ORGANIZER_REQUEST_SUBMITTED: Building2,
    ORGANIZER_REQUEST_APPROVED: Building2,
    ORGANIZER_REQUEST_REJECTED: Building2,
};

/**
 * Màu nền badge theo loại thông báo.
 */
export const NOTIFICATION_TYPE_COLORS = {
    ACCOUNT_REGISTRATION: "bg-blue-100 text-blue-600",
    SECURITY_ALERT: "bg-red-100 text-red-600",
    EVENT_UPDATE: "bg-purple-100 text-purple-600",
    EVENT_APPROVED: "bg-emerald-100 text-emerald-600",
    EVENT_REJECTED: "bg-red-100 text-red-600",
    PAYMENT_SUCCESS: "bg-emerald-100 text-emerald-600",
    PAYMENT_FAILED: "bg-red-100 text-red-600",
    REFUND: "bg-amber-100 text-amber-600",
    TICKET_ISSUED: "bg-cyan-100 text-cyan-600",
    CHECK_IN: "bg-indigo-100 text-indigo-600",
    RESALE_CREATED: "bg-sky-100 text-sky-600",
    RESALE_SOLD: "bg-emerald-100 text-emerald-600",
    RESALE_PAYMENT_SUCCESS: "bg-emerald-100 text-emerald-600",
    RESALE_CANCELLED: "bg-gray-100 text-gray-600",
    WALLET_TOPUP: "bg-violet-100 text-violet-600",
    WALLET_WITHDRAW: "bg-amber-100 text-amber-600",
    WALLET_PAYMENT: "bg-violet-100 text-violet-600",
    ORGANIZER_REQUEST_SUBMITTED: "bg-orange-100 text-orange-600",
    ORGANIZER_REQUEST_APPROVED: "bg-emerald-100 text-emerald-600",
    ORGANIZER_REQUEST_REJECTED: "bg-red-100 text-red-600",
};

/**
 * Icon mặc định khi loại thông báo chưa được khai báo.
 */
export const DEFAULT_NOTIFICATION_TYPE_ICON = Bell;

/**
 * Màu mặc định khi loại thông báo chưa được khai báo.
 */
export const DEFAULT_NOTIFICATION_TYPE_COLOR = "bg-gray-100 text-gray-600";

/**
 * Form cấu hình mặc định của trang System Setting > Thông báo.
 * Chỉ gồm phần cơ bản: các kênh gửi thông báo.
 */
export const DEFAULT_NOTIFICATION_FORM = {
    channels: {
        email: true,
        inApp: true,
    },
};

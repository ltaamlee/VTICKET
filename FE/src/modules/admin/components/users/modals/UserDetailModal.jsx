import { X, User, Mail, Shield, CheckCircle, Clock } from "lucide-react";
import Button from "../../../../../components/common/button/Button";

function UserDetailModal({ user, onClose }) {
    if (!user) return null;

    const roleName = user.role?.roleName || "Chưa xác định";

    const getRoleBadge = (role) => {
        switch (role) {
            case "ADMIN":
                return "bg-purple-100 text-purple-700";
            case "ORGANIZER":
                return "bg-blue-100 text-blue-700";
            case "USER":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-100 text-green-700";
            case "INACTIVE":
                return "bg-yellow-100 text-orange-700";
            case "BANNED":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const formattedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleString("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "Không xác định";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Chi tiết tài khoản
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5 text-sm">
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                            <User size={22} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {user.username || "Chưa cập nhật tên"}
                            </p>
                            <p className="text-xs text-gray-400">ID: {user.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail size={15} />
                                <span>Email</span>
                            </div>
                            <p className="mt-1 font-medium text-gray-800 break-all">
                                {user.email}
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Shield size={15} />
                                <span>Vai trò</span>
                            </div>
                            <div className="mt-1">
                                <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadge(
                                        roleName
                                    )}`}
                                >
                                    {roleName}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <CheckCircle size={15} />
                                <span>Trạng thái</span>
                            </div>
                            <div className="mt-1">
                                <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                                        user.status
                                    )}`}
                                >
                                    {user.status || "Chưa xác định"}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <CheckCircle size={15} />
                                <span>Xác thực email</span>
                            </div>
                            <p className="mt-1 font-medium text-gray-800">
                                {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={15} />
                            <span>Ngày tạo</span>
                        </div>
                        <p className="mt-1 font-medium text-gray-800">{formattedDate}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default UserDetailModal;

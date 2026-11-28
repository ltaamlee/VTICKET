import { User, Mail, Shield, CheckCircle, Clock } from "lucide-react";

import DetailPanel from "../../../../components/common/form/DetailPanel";
import { getRoleBadge, getStatusBadge } from "../../../../utils/badgeHelpers";

function UserDetailModal({ user, onClose }) {
    if (!user) return null;

    const formattedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleString("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "Không xác định";

    const roleName = user.role?.roleName || user.role || "Chưa xác định";

    return (
        <DetailPanel
            icon={User}
            title="Chi tiết tài khoản"
            subtitle={user.email}
            onClose={onClose}
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    Đóng
                </button>
            }
        >
            <div className="space-y-4 text-sm">
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
                        <p className="mt-1 break-all font-medium text-gray-800">
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
                    <p className="mt-1 font-medium text-gray-800">
                        {formattedDate}
                    </p>
                </div>
            </div>
        </DetailPanel>
    );
}

export default UserDetailModal;

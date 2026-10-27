import { useState, useEffect } from "react";
import { X } from "lucide-react";

import { updateUser } from "../../../services/userService";
import Button from "../../../../../components/common/button/Button";

function UserEditModal({ user, onClose, onSuccess }) {
    const [username, setUsername] = useState(user?.username || "");
    const [role, setRole] = useState(user?.role?.roleName || "USER");
    const [status, setStatus] = useState(user?.status || "ACTIVE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

        useEffect(() => {
        if (!user) return;

        setUsername(user.username || "");
        setRole(user.role?.roleName || "USER");
        setStatus(user.status || "ACTIVE");
        setError("");
    }, [user]);

    if (!user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await updateUser(user.id, {
                username: username.trim(),
                email: user.email,
                role,
                status,
            })
            onSuccess?.("Cập nhật thông tin người dùng thành công!");
            onClose();
        } catch (err) {
            setError(err.message || "Cập nhật người dùng thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Chỉnh sửa tài khoản
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 px-6 py-5 text-sm">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Email
                            </label>
                            <input
                                type="text"
                                disabled
                                value={user.email}
                                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Tên tài khoản (Username)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tên tài khoản"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Vai trò
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="USER">Khách hàng (USER)</option>
                                <option value="ORGANIZER">Ban tổ chức (ORGANIZER)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Trạng thái
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ACTIVE">Đã kích hoạt (ACTIVE)</option>
                                <option value="INACTIVE">Chưa kích hoạt (INACTIVE)</option>
                                <option value="BANNED">Bị khóa (BANNED)</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserEditModal;

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

function UserDeleteModal({ user, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!user) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError("");

        try {
            // Note: Xóa người dùng
            // Khi BE triển khai route DELETE /admin/users/:id, gọi API tại đây.
            onSuccess?.();
        } catch (err) {
            setError(err.message || "Xóa tài khoản thất bại");
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
                        Xác nhận xóa tài khoản
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
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                Bạn có chắc chắn muốn xóa tài khoản này không?
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Tài khoản <span className="font-semibold text-gray-700">{user.email}</span> (Username: {user.username || "Chưa cập nhật"}) sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? "Đang xóa..." : "Xác nhận xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserDeleteModal;

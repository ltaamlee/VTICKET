import { useState } from "react";
import { X, AlertTriangle} from "lucide-react";

import { deleteUser } from "../../../services/userService";
import Button from "../../../../../components/common/button/Button";

function UserDeleteModal({ user, onClose, onSuccess, onAlert }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!user) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError("");

        try {
            await deleteUser(user.id)
            onSuccess?.("Xóa tài khoản thành công!")
        } catch (err) {
            setError(err.message || "Xóa tài khoản thất bại");
            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
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

                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? "Đang xóa..." : "Xác nhận xóa"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default UserDeleteModal;
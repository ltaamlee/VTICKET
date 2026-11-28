import { useState } from "react";

import { deleteUser } from "../../services/userService";
import ConfirmModal from "../../../../components/common/ConfirmModal";

function UserDeleteModal({ user, onClose, onSuccess, onAlert }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!user) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError("");

        try {
            await deleteUser(user.id);
            onSuccess?.("Xóa tài khoản thành công!");
        } catch (err) {
            const message = err.message || "Xóa tài khoản thất bại";
            setError(message);
            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfirmModal
            isOpen
            onClose={onClose}
            onConfirm={handleDelete}
            title="Xác nhận xóa tài khoản"
            message="Bạn có chắc chắn muốn xóa tài khoản này không?"
            description={
                <>
                    Tài khoản{" "}
                    <span className="font-semibold text-gray-700">
                        {user.email}
                    </span>{" "}
                    (Username: {user.username || "Chưa cập nhật"}) sẽ bị xóa
                    khỏi hệ thống. Thao tác này không thể hoàn tác.
                    {error && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                            {error}
                        </p>
                    )}
                </>
            }
            variant="danger"
            confirmText="Xác nhận xóa"
            loading={loading}
        />
    );
}

export default UserDeleteModal;

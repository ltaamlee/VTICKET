import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { deleteCategory } from "../../services/categoryService";
import ConfirmModal from "../../../../components/common/ConfirmModal";

function CategoryDeleteModal({ category, onClose, onSuccess, onAlert }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!category) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError("");

        try {
            await deleteCategory(category.id);
            onSuccess?.("Xóa danh mục thành công!");
        } catch (err) {
            const message = err.message || "Xóa danh mục thất bại!";
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
            title="Xác nhận xóa danh mục"
            message="Bạn có chắc chắn muốn xóa danh mục này không?"
            description={
                <>
                    Danh mục{" "}
                    <span className="font-semibold text-gray-700">
                        {category.name}
                    </span>{" "}
                    sẽ bị xóa khỏi hệ thống. Thao tác này có thể ảnh hưởng đến
                    các sự kiện đang sử dụng danh mục.
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

export default CategoryDeleteModal;

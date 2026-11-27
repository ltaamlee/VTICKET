import { useState } from "react";

import ConfirmModal from "../../../../components/common/ConfirmModal";
import { deleteEvent } from "../../services/eventService";

function EventDeleteModal({ event, onClose, onSuccess, onAlert }) {
    const [loading, setLoading] = useState(false);

    if (!event) return null;

    const handleDelete = async () => {
        try {
            setLoading(true);

            await deleteEvent(event.id);

            onSuccess?.("Xóa sự kiện thành công.");
        } catch (error) {
            onAlert?.(
                "error",
                error.message || "Không thể xóa sự kiện."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfirmModal
            isOpen
            onClose={onClose}
            onConfirm={handleDelete}
            title="Xác nhận xóa sự kiện"
            message="Bạn có chắc chắn muốn xóa sự kiện này không?"
            description={
                <>
                    Sự kiện{" "}
                    <span className="font-semibold text-gray-700">
                        "{event.name}"
                    </span>{" "}
                    sẽ bị xóa khỏi hệ thống. Thao tác này có thể ảnh hưởng đến
                    các dữ liệu liên quan.
                </>
            }
            variant="danger"
            confirmText="Xóa sự kiện"
            loading={loading}
        />
    );
}

export default EventDeleteModal;

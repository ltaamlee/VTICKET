
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "../../../../components/common/button/Button";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Xác nhận xóa sự kiện
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-700"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="text-red-600" size={28} />
                    </div>

                    <p className="text-sm text-gray-600">
                        Bạn có chắc chắn muốn xóa sự kiện
                    </p>

                    <p className="mt-2 font-semibold text-gray-900">
                        "{event.name}"
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                        Thao tác này có thể ảnh hưởng đến các dữ liệu liên quan.
                    </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>

                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? "Đang xóa..." : "Xóa sự kiện"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default EventDeleteModal;
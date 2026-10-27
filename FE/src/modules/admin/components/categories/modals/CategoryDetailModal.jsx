import { X, Tag, FileText, Clock, Hash } from "lucide-react";
import Button from "../../../../../components/common/button/Button";

function CategoryDetailModal({ category, onClose }) {
    if (!category) return null;

    const formattedDate = category.createdAt
        ? new Date(category.createdAt).toLocaleString("vi-VN", {
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
                        Chi tiết danh mục
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
                            <Tag size={22} />
                        </div>

                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                                {category.name || "Chưa có tên danh mục"}
                            </p>

                            <p className="break-all text-xs text-gray-400">
                                ID: {category.id || "Không xác định"}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FileText size={15} />
                            <span>Slug</span>
                        </div>

                        <p className="mt-1 whitespace-pre-wrap wrap-break-words text-gray-800">
                            {category.slug || "Chưa có slug"}
                        </p>
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

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CategoryDetailModal;
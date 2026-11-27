import { Tag, FileText, Clock } from "lucide-react";
import DetailPanel from "../../../../components/common/form/DetailPanel";

function CategoryDetailModal({ category, onClose }) {
    if (!category) return null;

    const formattedDate = category.createdAt
        ? new Date(category.createdAt).toLocaleString("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "Không xác định";

    return (
        <DetailPanel
            icon={Tag}
            title="Chi tiết danh mục"
            subtitle={category.name || "Chưa có tên danh mục"}
            onClose={onClose}
        >
            <div className="space-y-4 text-sm">
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

                    <p className="mt-1 whitespace-pre-wrap break-words text-gray-800">
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
        </DetailPanel>
    );
}

export default CategoryDetailModal;

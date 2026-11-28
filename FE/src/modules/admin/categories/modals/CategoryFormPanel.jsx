import { useState } from "react";
import { createCategory, updateCategory } from "../../services/categoryService";
import Button from "../../../../components/common/button/Button";
import { generateSlug } from "../../../../utils/generateSlug";
import { X } from "lucide-react"

function CategoryFormPanel({
    mode = "create",
    category = null,
    onClose,
    onSuccess,
    onAlert,
}) {
    const isEdit = mode === "edit";
    const [name, setName] = useState(category?.name || "");
    const [slug, setSlug] = useState(category?.slug || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !slug.trim()) {
            setError("Vui lòng nhập tên và slug danh mục.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = {
                name: name.trim(),
                slug: slug.trim(),
            };

            if (isEdit) {
                const categoryId = category?.id || category?._id;
                if (!categoryId) {
                    throw new Error("Không tìm thấy mã danh mục cần cập nhật.");
                }
                await updateCategory(categoryId, payload);
            } else {
                await createCategory(payload);
            }

            onSuccess?.(
                isEdit
                    ? "Cập nhật danh mục thành công!"
                    : "Tạo danh mục thành công!"
            );
        } catch (err) {
            const message =
                err.message ||
                (isEdit
                    ? "Không thể cập nhật danh mục."
                    : "Không thể tạo danh mục.");
            setError(message);
            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isEdit ? "Chỉnh sửa danh mục" : "Tạo danh mục"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>
                </div>


                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 p-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Tên danh mục
                            </label>
                            <input
                                value={name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setName(value);
                                    setSlug(generateSlug(value));
                                }}
                                placeholder="Ví dụ: Âm nhạc"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Slug
                            </label>
                            <input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="Ví dụ: am-nhac"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading
                                ? isEdit
                                    ? "Đang lưu..."
                                    : "Đang tạo..."
                                : isEdit
                                  ? "Lưu thay đổi"
                                  : "Tạo danh mục"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CategoryFormPanel;
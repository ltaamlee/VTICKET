import { useState, useEffect } from "react";
import { X } from "lucide-react";

import { updateCategory } from "../../../services/categoryService";
import Button from "../../../../../components/common/button/Button";
import { generateSlug } from "../../../../../utils/generateSlug";

function CategoryEditModal({ category, onClose, onSuccess }) {
    const [name, setName] = useState(category?.name || "");
    const [slug, setSlug] = useState(category?.slug || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!category) return;

        setName(category.name || "");
        setSlug(category.slug || "");
        setError("");
    }, [category]);

    if (!category) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !slug.trim()) {
            setError("Tên danh mục và slug không được để trống");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await updateCategory(category.id || category._id, {
                name: name.trim(),
                slug: slug.trim(),
            });

            onSuccess?.("Cập nhật danh mục thành công!");
            onClose();
        } catch (err) {
            setError(err.message || "Cập nhật danh mục thất bại");
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
                        Chỉnh sửa danh mục
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
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
                                Tên danh mục
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setName(value);

                                    const newSlug = generateSlug(value);
                                    setSlug(newSlug);

                                    console.log("Tên mới:", value);
                                    console.log("Slug mới:", newSlug);
                                }}
                                placeholder="Nhập tên danh mục"
                                required
                                maxLength={100}
                                disabled={loading}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Slug
                            </label>

                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="VD: am-nhac"
                                required
                                maxLength={150}
                                disabled={loading}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                            />

                            <p className="mt-1 text-xs text-gray-400">
                                Slug dùng trong URL của danh mục.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CategoryEditModal;
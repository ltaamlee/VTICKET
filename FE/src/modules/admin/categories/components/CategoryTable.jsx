
import { useState } from "react";
import IconButton from "../../../../components/common/button/IconButton";
import CategoryDetailModal from "../modals/CategoryDetailModal";
import CategoryFormPanel from "../modals/CategoryFormPanel";
import CategoryDeleteModal from "../modals/CategoryDeleteModal";

function CategoryTable({
    categories = [],
    loading = false,
    currentPage = 1,
    pageSize = 10,
    onRefresh,
    onAlert,
}) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalType, setModalType] = useState(null);

    // Đảm bảo dữ liệu luôn là một mảng
    const categoryList = Array.isArray(categories)
        ? categories
        : Array.isArray(categories?.categories)
            ? categories.categories
            : [];

    const handleView = (category) => {
        setSelectedCategory(category);
        setModalType("view");
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setModalType("edit");
    };

    const handleDelete = (category) => {
        setSelectedCategory(category);
        setModalType("delete");
    };

    const handleCloseModal = () => {
        setSelectedCategory(null);
        setModalType(null);
    };

    const handleSuccess = (message) => {
        handleCloseModal();
        onRefresh?.();
        onAlert?.("success", message);
    };

    const formatDate = (date) => {
        if (!date) return "Chưa cập nhật";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Không hợp lệ";
        }

        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(parsedDate);
    };

    const getEventCount = (category) => {
        return (
            category?.eventCount ??
            category?._count?.events ??
            0
        );
    };

    return (
        <>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-4">STT</th>
                            <th className="px-5 py-4">Tên danh mục</th>
                            <th className="px-5 py-4">Slug</th>
                            <th className="px-5 py-4">Số sự kiện</th>
                            <th className="px-5 py-4">Ngày tạo</th>
                            <th className="w-[220px] px-5 py-4 text-center">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-5 py-12 text-center text-gray-500"
                                >
                                    Đang tải danh sách danh mục...
                                </td>
                            </tr>
                        ) : categoryList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-5 py-12 text-center"
                                >
                                    <p className="mb-2 font-medium text-gray-600">
                                        Chưa có dữ liệu danh mục
                                    </p>

                                    <p className="text-gray-400">
                                        Không tìm thấy danh mục phù hợp.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            categoryList.map((category, index) => (
                                <tr
                                    key={category?.id ?? category?._id ?? index}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-5 py-4">
                                        {(Math.max(1, Number(currentPage) || 1) - 1) *
                                            (Math.max(1, Number(pageSize) || 10)) +
                                            index +
                                            1}
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="font-medium text-gray-900">
                                            {category?.name || "Chưa cập nhật"}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                            {category?.slug || "Chưa có slug"}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        {getEventCount(category)}
                                    </td>

                                    <td className="px-5 py-4">
                                        {formatDate(category?.createdAt)}
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <IconButton
                                                icon="view"
                                                variant="view"
                                                title="Xem chi tiết"
                                                onClick={() => handleView(category)}
                                            />

                                            <IconButton
                                                icon="edit"
                                                variant="edit"
                                                title="Chỉnh sửa"
                                                onClick={() => handleEdit(category)}
                                            />

                                            <IconButton
                                                icon="delete"
                                                variant="delete"
                                                title="Xóa"
                                                onClick={() => handleDelete(category)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {modalType === "view" && selectedCategory && (
                <CategoryDetailModal
                    category={selectedCategory}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "edit" && selectedCategory && (
                <CategoryFormPanel
                    mode="edit"
                    category={selectedCategory}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                    onAlert={onAlert}
                />
            )}

            {modalType === "delete" && selectedCategory && (
                <CategoryDeleteModal
                    category={selectedCategory}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                    onAlert={onAlert}
                />
            )}
        </>
    );
}

export default CategoryTable;
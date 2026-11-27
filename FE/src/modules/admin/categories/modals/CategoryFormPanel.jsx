import { useState } from "react";
import { Tag } from "lucide-react";

import { createCategory, updateCategory } from "../../services/categoryService";
import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../../components/common/form/FormPanel";
import { generateSlug } from "../../../../utils/generateSlug";

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
        e?.preventDefault();

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
        <FormPanel
            icon={Tag}
            title={isEdit ? "Chỉnh sửa danh mục" : "Tạo danh mục"}
            subtitle={
                isEdit
                    ? "Cập nhật thông tin danh mục"
                    : "Điền thông tin để tạo danh mục mới"
            }
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitText={isEdit ? "Lưu thay đổi" : "Tạo danh mục"}
        >
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>Tên danh mục</label>
                <input
                    value={name}
                    onChange={(e) => {
                        const value = e.target.value;
                        setName(value);
                        setSlug(generateSlug(value));
                    }}
                    placeholder="Ví dụ: Âm nhạc"
                    className={FORM_PANEL_INPUT_CLASS}
                    required
                />
            </div>

            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>Slug</label>
                <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Ví dụ: am-nhac"
                    className={FORM_PANEL_INPUT_CLASS}
                    required
                />
            </div>
        </FormPanel>
    );
}

export default CategoryFormPanel;

import { MapPin } from "lucide-react";

import { inputClass, labelClass, textareaClass } from "./formStyles";

export default function EventBasicInfoSection({
    formData,
    handleChange,
    categories = [],
    selectedCategoryExists = true,
    getCategoryId = (category) => String(category.id ?? ""),
    currentCategoryName = "",
    slugError = "",
    children,
}) {
    return (
        <div className="space-y-5">
            <div>
                <label className={labelClass}>
                    Tên sự kiện{" "}
                    <span className="text-red-500">*</span>
                </label>

                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập tên sự kiện"
                    className={inputClass}
                    required
                />
            </div>

            <div>
                <label className={labelClass}>
                    Slug <span className="text-red-500">*</span>
                </label>

                <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="Ví dụ: fanmeeting-quai-kiet"
                    className={`${inputClass} ${
                        slugError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-50"
                            : ""
                    }`}
                    required
                />

                {slugError && (
                    <p className="mt-1.5 text-xs text-red-500">
                        {slugError}
                    </p>
                )}
            </div>

            <div>
                <label className={labelClass}>
                    Danh mục <span className="text-red-500">*</span>
                </label>

                <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                >
                    <option value="">Chọn danh mục sự kiện</option>

                    {formData.categoryId && !selectedCategoryExists && (
                        <option value={formData.categoryId}>
                            {currentCategoryName || "Danh mục hiện tại"}
                        </option>
                    )}

                    {categories.map((category) => (
                        <option
                            key={getCategoryId(category)}
                            value={getCategoryId(category)}
                        >
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className={labelClass}>
                    Địa điểm <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                    <MapPin
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Nhập địa điểm tổ chức"
                        className={`${inputClass} pl-10`}
                        required
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Mô tả sự kiện</label>

                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Giới thiệu nội dung sự kiện..."
                    className={textareaClass}
                />
            </div>

            {/* Khu vực mở rộng (ví dụ: chọn sơ đồ ghế) */}
            {children}
        </div>
    );
}

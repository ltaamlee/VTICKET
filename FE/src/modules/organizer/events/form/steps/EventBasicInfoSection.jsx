import { MapPin, Video, Globe, Building } from "lucide-react";

import { inputClass, labelClass } from "../../modals/formStyles";
import TextEditor from "../../../../../components/common/editor/TextEditor";

const ONLINE_PLATFORMS = [
    "Google Meet",
    "Zoom Meeting",
    "Microsoft Teams",
    "YouTube Live",
    "Facebook Live",
];

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
    const isOnline =
        formData.eventType === "ONLINE" ||
        (!formData.eventType &&
            (formData.location?.toLowerCase().includes("online") ||
                formData.location?.toLowerCase().includes("trực tuyến") ||
                formData.location?.toLowerCase().includes("zoom") ||
                formData.location?.toLowerCase().includes("meet")));

    const handleEventTypeChange = (type) => {
        handleChange({
            target: {
                name: "eventType",
                value: type,
            },
        });

        // Nếu chuyển sang Online và location chưa có thông tin
        if (type === "ONLINE" && (!formData.location || !formData.location.includes("Trực tuyến"))) {
            handleChange({
                target: {
                    name: "location",
                    value: "Google Meet",
                },
            });
        } else if (type === "OFFLINE" && (formData.location === "Google Meet" || formData.location?.startsWith("Trực tuyến"))) {
            handleChange({
                target: {
                    name: "location",
                    value: "",
                },
            });
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                    <h4 className="mb-4 text-sm font-medium text-gray-800">
                        Tên sự kiện
                        <span className="text-red-500">*</span>
                    </h4>
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
                <label className={`${labelClass} flex items-center gap-1`}>
                    <h4 className="mb-4 text-sm font-medium text-gray-800">
                        Slug
                        <span className="text-red-500">*</span>
                    </h4>
                </label>

                <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="Ví dụ: fanmeeting-quai-kiet"
                    className={`${inputClass} ${slugError
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
                <label className={`${labelClass} flex items-center gap-1`}>
                    <h4 className="mb-4 text-sm font-medium text-gray-800">
                        Danh mục
                        <span className="text-red-500">*</span>
                    </h4>
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

            {/* HÌNH THỨC TỔ CHỨC: ONLINE / OFFLINE */}
            <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                    <h4 className="mb-4 text-sm font-medium text-gray-800">
                        Hình thức tổ chức
                        <span className="text-red-500">*</span>
                    </h4>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleEventTypeChange("OFFLINE")}
                        className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs sm:text-sm font-medium transition ${!isOnline
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        <Building size={16} className={!isOnline ? "text-blue-600" : "text-gray-400"} />
                        <span>Trực tiếp (Offline)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleEventTypeChange("ONLINE")}
                        className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs sm:text-sm font-medium transition ${isOnline
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        <Video size={16} className={isOnline ? "text-blue-600" : "text-gray-400"} />
                        <span>Trực tuyến (Online)</span>
                    </button>
                </div>
            </div>

            {/* ĐỊA ĐIỂM HOẶC LINK ONLINE */}
            <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                    <h4>
                        {isOnline
                            ? "Nền tảng / Link tham gia trực tuyến"
                            : "Địa điểm tổ chức"}

                        <span className="text-red-500">*</span>
                    </h4>
                </label>

                <div className="relative">
                    {isOnline ? (
                        <Globe
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    ) : (
                        <MapPin
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    )}

                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder={
                            isOnline
                                ? "Ví dụ: Zoom, Google Meet hoặc link sự kiện..."
                                : "Nhập địa điểm tổ chức (địa chỉ, hội trường...)"
                        }
                        className={`${inputClass} pl-10`}
                        required
                    />
                </div>

                {isOnline && (
                    <div className="mt-2 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-gray-400">Gợi ý nhanh:</span>
                            {ONLINE_PLATFORMS.map((platform) => (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() =>
                                        handleChange({
                                            target: {
                                                name: "location",
                                                value: platform,
                                            },
                                        })
                                    }
                                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                    <h4 className="mb-4 text-sm font-medium text-gray-800">
                        Mô tả sự kiện
                        <span className="text-red-500">*</span>
                    </h4>
                </label>
                <TextEditor
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Giới thiệu nội dung, lịch trình, khách mời và chi tiết sự kiện..."
                    minHeight={160}
                />
            </div>
            {children}
        </div>
    );
}

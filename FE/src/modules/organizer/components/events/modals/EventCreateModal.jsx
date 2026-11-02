
import { useEffect, useRef, useState } from "react";
import {
    X,
    ImagePlus,
    Upload,
    Trash2,
    CalendarDays,
    MapPin,
    FileText,
    Send,
    Save,
    ClipboardCheck,
} from "lucide-react";

import Button from "../../../../../components/common/button/Button";
import { createEvent, uploadEventImage } from "../../../services/eventService";
import { generateSlug } from "../../../../../utils/generateSlug";
import ImageUploader from "../ImageUploader";

function EventCreateModal({
    categories = [],
    onClose,
    onSuccess,
    onAlert,
}) {
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        categoryId: "",
        description: "",
        slug: "",
        location: "",
        startAt: "",
        endAt: "",
        saleStartAt: "",
        saleEndAt: "",
    });

    const [bannerFile, setBannerFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "name") {
            setFormData((prev) => ({
                ...prev,
                name: value,
                slug: generateSlug(value),
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (status) => {
        if (loading) return;

        if (!formData.name.trim()) {
            return onAlert?.("error", "Vui lòng nhập tên sự kiện.");
        }

        if (!formData.slug.trim()) {
            return onAlert?.("error", "Vui lòng nhập slug sự kiện.");
        }

        if (!formData.categoryId) {
            return onAlert?.("error", "Vui lòng chọn danh mục.");
        }

        if (!formData.location.trim()) {
            return onAlert?.("error", "Vui lòng nhập địa điểm.");
        }

        if (!formData.startAt || !formData.endAt) {
            return onAlert?.("error", "Vui lòng chọn thời gian diễn ra.");
        }

        if (new Date(formData.startAt) >= new Date(formData.endAt)) {
            return onAlert?.(
                "error",
                "Thời gian kết thúc phải sau thời gian bắt đầu."
            );
        }

        if (
            formData.saleStartAt &&
            formData.saleEndAt &&
            new Date(formData.saleStartAt) >= new Date(formData.saleEndAt)
        ) {
            return onAlert?.(
                "error",
                "Thời gian kết thúc mở bán phải sau thời gian bắt đầu."
            );
        }

        if (
            formData.saleStartAt &&
            new Date(formData.saleStartAt) >= new Date(formData.startAt)
        ) {
            return onAlert?.(
                "error",
                "Thời gian mở bán phải trước khi sự kiện bắt đầu."
            );
        }

        if (
            formData.saleEndAt &&
            new Date(formData.saleEndAt) > new Date(formData.startAt)
        ) {
            return onAlert?.(
                "error",
                "Thời gian kết thúc mở bán không được sau thời gian bắt đầu sự kiện."
            );
        }

        try {
            setLoading(true);

            let bannerUrl = null;
            let thumbnailUrl = null;

            if (bannerFile) {
                const response = await uploadEventImage(
                    bannerFile,
                    "vticket/events"
                );

                bannerUrl = response.data.url;
            }

            if (thumbnailFile) {
                const response = await uploadEventImage(
                    thumbnailFile,
                    "vticket/events"
                );

                thumbnailUrl = response.data.url;
            }

            const payload = {
                name: formData.name.trim(),
                categoryId: formData.categoryId,
                slug: formData.slug.trim(),
                location: formData.location.trim(),
                description: formData.description.trim(),

                startAt: new Date(formData.startAt).toISOString(),
                endAt: new Date(formData.endAt).toISOString(),

                saleStartAt: formData.saleStartAt
                    ? new Date(formData.saleStartAt).toISOString()
                    : null,

                saleEndAt: formData.saleEndAt
                    ? new Date(formData.saleEndAt).toISOString()
                    : null,

                bannerUrl,
                thumbnailUrl,

                // DRAFT: Lưu nháp
                // PENDING: Gửi Admin phê duyệt
                status,
            };

            await createEvent(payload);

            if (status === "DRAFT") {
                onSuccess?.("Đã lưu sự kiện dưới dạng bản nháp.");
            } else {
                onSuccess?.("Đã gửi sự kiện đến Admin để phê duyệt.");
            }
        } catch (error) {
            onAlert?.(
                "error",
                error.message || "Không thể tạo sự kiện."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (status) => {
        if (!formRef.current?.reportValidity()) return;
        handleSubmit(status);
    };

    const inputClass =
        "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-gray-700";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-gray-900">
                        Tạo sự kiện mới
                    </h2>

                    <div className="invisible">
                        <X size={21} />
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                    >
                        <X size={21} />
                    </button>
                </div>

                <form
                    ref={formRef}
                    onSubmit={(e) => e.preventDefault()}
                    className="min-h-0 flex-1 overflow-y-auto"
                >
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-6 lg:grid-cols-2">

                        {/* THÔNG TIN SỰ KIỆN */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-center gap-2 pb-3">
                                <FileText size={18} className="text-blue-600" />
                                <h3 className="font-semibold text-gray-900">
                                    Thông tin sự kiện
                                </h3>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Tên sự kiện <span className="text-red-500">*</span>
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
                                    placeholder="Ví dụ: sac-xuan-viet-2026"
                                    className={inputClass}
                                    required
                                />
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

                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
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
                                <label className={labelClass}>
                                    Mô tả sự kiện
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Giới thiệu nội dung sự kiện..."
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        </div>

                        {/* THỜI GIAN SỰ KIỆN */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-center gap-2 pb-3">
                                <CalendarDays size={18} className="text-blue-600" />
                                <h3 className="font-semibold text-gray-900">
                                    Thời gian sự kiện
                                </h3>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <h4 className="mb-4 text-sm font-semibold text-gray-800">
                                    Thời gian diễn ra
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>
                                            Bắt đầu <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="datetime-local"
                                            name="startAt"
                                            value={formData.startAt}
                                            onChange={handleChange}
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Kết thúc <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="datetime-local"
                                            name="endAt"
                                            value={formData.endAt}
                                            min={formData.startAt || undefined}
                                            onChange={handleChange}
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-gray-800">
                                        Thời gian mở bán vé
                                    </h4>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Có thể bỏ trống và cấu hình sau.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>
                                            Bắt đầu mở bán
                                        </label>

                                        <input
                                            type="datetime-local"
                                            name="saleStartAt"
                                            value={formData.saleStartAt}
                                            onChange={handleChange}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Kết thúc mở bán
                                        </label>

                                        <input
                                            type="datetime-local"
                                            name="saleEndAt"
                                            value={formData.saleEndAt}
                                            min={formData.saleStartAt || undefined}
                                            onChange={handleChange}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* THUMBNAIL VÀ BANNER */}
                        <div className="grid grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] items-start gap-5 lg:col-span-2">
                            <div className="max-w-[280px]">
                                <ImageUploader
                                    title="Ảnh thẻ sự kiện"
                                    ratio="1:1"
                                    recommendation="Khuyến nghị: 600 × 600 px"
                                    file={thumbnailFile}
                                    setFile={setThumbnailFile}
                                    onAlert={onAlert}
                                />
                            </div>

                            <ImageUploader
                                title="Ảnh banner"
                                ratio="16:9"
                                recommendation="Khuyến nghị: 1920 × 1080 px"
                                file={bannerFile}
                                setFile={setBannerFile}
                                onAlert={onAlert}
                            />
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
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
                            variant="secondary"
                            onClick={() => handleAction("DRAFT")}
                            disabled={loading}
                        >
                            <Save size={16} />
                            {loading ? "Đang xử lý..." : "Lưu nháp"}
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => handleAction("PENDING")}
                            disabled={loading}
                        >
                            <Send size={16} />
                            {loading ? "Đang xử lý..." : "Gửi phê duyệt"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventCreateModal;
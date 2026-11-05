import { useEffect, useRef, useState } from "react";
import { X, FileText, Send, Save } from "lucide-react";

import Button from "../../../../../components/common/button/Button";
import { generateSlug } from "../../../../../utils/generateSlug";
import {
    updateEvent,
    uploadEventImage,
    submitEvent,
} from "../../../services/eventService";
import EventBasicInfoSection from "./EventBasicInfoSection";
import EventScheduleSection from "./EventScheduleSection";
import EventImagesSection from "./EventImagesSection";
import EventSeatMapSection from "./EventSeatMapSection";

function EventEditModal({
    event,
    categories = [],
    onClose,
    onSuccess,
    onAlert,
    onManageSeatMaps,
    seatMapRefreshKey = 0,
}) {
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        categoryId: "",
        description: "",
        location: "",
        startAt: "",
        endAt: "",
        saleStartAt: "",
        saleEndAt: "",
        bannerUrl: "",
        thumbnailUrl: "",
        seatMapId: "",
    });

    const [bannerFile, setBannerFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const canSubmitApproval =
        event?.status === "DRAFT" || event?.status === "REJECTED";

    // Chuyển ngày từ API sang datetime-local theo múi giờ local.
    const toLocalDateTime = (date) => {
        if (!date) return "";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return "";

        const offset = parsed.getTimezoneOffset() * 60000;

        return new Date(parsed.getTime() - offset)
            .toISOString()
            .slice(0, 16);
    };

    // Chuẩn hóa ID danh mục.
    const getCategoryId = (category) => {
        if (!category) return "";

        return String(
            category.id ??
            category._id ??
            ""
        );
    };

    // Lấy ID danh mục từ dữ liệu sự kiện.
    const resolveCategoryId = (eventData) => {
        // Ưu tiên categoryId được trả về trực tiếp từ API.
        const directId =
            eventData.categoryId ??
            eventData.category?.id ??
            eventData.category?._id;

        if (directId) {
            return String(directId);
        }

        // Nếu API chỉ trả về tên danh mục,
        // tìm ID tương ứng trong danh sách categories.
        const categoryName = eventData.category?.name;

        if (categoryName && Array.isArray(categories)) {
            const matchedCategory = categories.find(
                (category) =>
                    category.name?.trim().toLowerCase() ===
                    categoryName.trim().toLowerCase()
            );

            if (matchedCategory) {
                return getCategoryId(matchedCategory);
            }
        }

        return "";
    };

    // Load dữ liệu sự kiện khi mở modal.
    useEffect(() => {
        if (!event) return;

        setFormData({
            name: event.name || "",
            slug: event.slug || "",
            categoryId: resolveCategoryId(event),
            description: event.description || "",
            location: event.location || "",
            startAt: toLocalDateTime(event.startAt),
            endAt: toLocalDateTime(event.endAt),
            saleStartAt: toLocalDateTime(event.saleStartAt),
            saleEndAt: toLocalDateTime(event.saleEndAt),
            bannerUrl: event.bannerUrl || "",
            thumbnailUrl: event.thumbnailUrl || "",
            seatMapId: event.seatMapId || event.seatMap?.id || "",
        });

        setBannerFile(null);
        setThumbnailFile(null);
    }, [event]);

    // Nếu danh sách categories tải sau event,
    // tìm lại ID theo tên danh mục hiện tại.
    useEffect(() => {
        if (!event || !categories.length) return;

        const categoryId = resolveCategoryId(event);

        if (categoryId) {
            setFormData((prev) => ({
                ...prev,
                categoryId,
            }));
        }
    }, [categories, event]);

    // Kiểm tra danh mục hiện tại có trong danh sách không.
    const selectedCategoryExists = categories.some(
        (category) =>
            getCategoryId(category) === String(formData.categoryId)
    );

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

    // Validate dữ liệu nghiệp vụ.
    const validateForm = () => {
        if (
            !formData.name.trim() ||
            !formData.slug.trim() ||
            !formData.categoryId ||
            !formData.location.trim() ||
            !formData.startAt ||
            !formData.endAt
        ) {
            onAlert?.(
                "error",
                "Vui lòng nhập đầy đủ thông tin bắt buộc."
            );
            return false;
        }

        if (
            new Date(formData.startAt) >=
            new Date(formData.endAt)
        ) {
            onAlert?.(
                "error",
                "Thời gian kết thúc phải sau thời gian bắt đầu."
            );
            return false;
        }

        if (
            formData.saleStartAt &&
            formData.saleEndAt &&
            new Date(formData.saleStartAt) >=
            new Date(formData.saleEndAt)
        ) {
            onAlert?.(
                "error",
                "Thời gian kết thúc mở bán phải sau thời gian bắt đầu."
            );
            return false;
        }

        if (
            formData.saleStartAt &&
            new Date(formData.saleStartAt) >=
            new Date(formData.startAt)
        ) {
            onAlert?.(
                "error",
                "Thời gian mở bán phải trước khi sự kiện bắt đầu."
            );
            return false;
        }

        if (
            formData.saleEndAt &&
            new Date(formData.saleEndAt) >
            new Date(formData.startAt)
        ) {
            onAlert?.(
                "error",
                "Thời gian kết thúc mở bán không được sau thời gian bắt đầu sự kiện."
            );
            return false;
        }

        return true;
    };

    // Cập nhật sự kiện hoặc gửi phê duyệt.
    const handleSubmit = async (targetStatus) => {
        if (loading) return;

        if (!validateForm()) return;

        try {
            setLoading(true);

            let bannerUrl = formData.bannerUrl;
            let thumbnailUrl = formData.thumbnailUrl;

            // Upload banner mới nếu có.
            if (bannerFile) {
                const response = await uploadEventImage(
                    bannerFile,
                    "vticket/events"
                );

                bannerUrl = response.data.url;
            }

            // Upload thumbnail mới nếu có.
            if (thumbnailFile) {
                const response = await uploadEventImage(
                    thumbnailFile,
                    "vticket/events"
                );

                thumbnailUrl = response.data.url;
            }

            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                categoryId: String(formData.categoryId),
                description: formData.description.trim(),
                location: formData.location.trim(),

                startAt: new Date(formData.startAt).toISOString(),
                endAt: new Date(formData.endAt).toISOString(),

                saleStartAt: formData.saleStartAt
                    ? new Date(formData.saleStartAt).toISOString()
                    : null,

                saleEndAt: formData.saleEndAt
                    ? new Date(formData.saleEndAt).toISOString()
                    : null,

                bannerUrl: bannerUrl || null,
                thumbnailUrl: thumbnailUrl || null,
                seatMapId: formData.seatMapId || null,
            };

            // Bước 1: Lưu thông tin sự kiện.
            await updateEvent(event.id, payload);

            // Bước 2: Nếu gửi duyệt, gọi API chuyển trạng thái PENDING.
            if (targetStatus === "PENDING") {
                await submitEvent(event.id);

                onSuccess?.(
                    "Đã gửi sự kiện đến Admin để phê duyệt."
                );
            } else {
                onSuccess?.("Cập nhật sự kiện thành công.");
            }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Không thể cập nhật sự kiện.";

            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra HTML validation trước khi submit.
    const handleAction = (targetStatus) => {
        if (!formRef.current?.reportValidity()) return;

        handleSubmit(targetStatus);
    };

    if (!event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-gray-900">
                        Chỉnh sửa sự kiện
                    </h2>

                    <div className="invisible">
                        <X size={21} />
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed"
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

                            <EventBasicInfoSection
                                formData={formData}
                                handleChange={handleChange}
                                categories={categories}
                                selectedCategoryExists={
                                    selectedCategoryExists
                                }
                                getCategoryId={getCategoryId}
                                currentCategoryName={
                                    event.category?.name ||
                                    event.categoryName ||
                                    ""
                                }
                            >
                            <EventSeatMapSection
                                value={formData.seatMapId}
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        seatMapId: value,
                                    }))
                                }
                                onAlert={onAlert}
                                onManageSeatMaps={onManageSeatMaps}
                                refreshKey={seatMapRefreshKey}
                            />
                            </EventBasicInfoSection>
                        </div>

                        {/* THỜI GIAN SỰ KIỆN */}
                        <EventScheduleSection
                            formData={formData}
                            handleChange={handleChange}
                        />

                        {/* THUMBNAIL VÀ BANNER */}
                        <EventImagesSection
                            formData={formData}
                            setFormData={setFormData}
                            thumbnailFile={thumbnailFile}
                            setThumbnailFile={setThumbnailFile}
                            bannerFile={bannerFile}
                            setBannerFile={setBannerFile}
                            onAlert={onAlert}
                        />
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
                            onClick={() => handleAction(event.status)}
                            disabled={loading}
                        >
                            <Save size={16} />
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>

                        {canSubmitApproval && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => handleAction("PENDING")}
                                disabled={loading}
                            >
                                <Send size={16} />
                                {loading
                                    ? "Đang xử lý..."
                                    : "Lưu và gửi phê duyệt"}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventEditModal;
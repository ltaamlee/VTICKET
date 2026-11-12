import { useRef, useState } from "react";
import { X, FileText, Send, Save, ChevronLeft, ChevronRight } from "lucide-react";

import Button from "../../../../components/common/button/Button";
import {
    createEvent,
    updateEvent,
    uploadEventImage,
    submitEvent,
} from "../../services/eventService";
import { generateSlug } from "../../../../utils/generateSlug";
import EventBasicInfoSection from "../form/steps/EventBasicInfoSection";
import EventScheduleSection from "../form/steps/EventScheduleSection";
import EventImagesSection from "../form/steps/EventImagesSection";
import EventSeatMapSection from "../form/steps/EventSeatMapSection";

import { EVENT_DESCRIPTION_TEMPLATE } from "../../../../utils/eventDescriptionTemplate";

function toLocalDateTime(date) {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

function resolveCategoryId(event, categories) {
    const directId =
        event?.categoryId ?? event?.category?.id ?? event?.category?._id;
    if (directId) return String(directId);

    const categoryName = event?.category?.name || event?.categoryName || "";
    const matchedCategory = categories.find(
        (category) =>
            category.name?.trim().toLowerCase() ===
            categoryName.trim().toLowerCase()
    );

    return matchedCategory
        ? String(matchedCategory.id ?? matchedCategory._id ?? "")
        : "";
}

function createInitialFormData(event, isEdit, categories) {
    if (!isEdit || !event) {
        return {
            name: "",
            categoryId: "",
            description: EVENT_DESCRIPTION_TEMPLATE,
            slug: "",
            eventType: "OFFLINE",
            location: "",
            startAt: "",
            endAt: "",
            saleStartAt: "",
            saleEndAt: "",
            bannerUrl: "",
            thumbnailUrl: "",
            seatMapId: "",
        };
    }

    const isOnline =
        event.eventType === "ONLINE" ||
        (!event.eventType &&
            (event.location?.toLowerCase().includes("online") ||
                event.location?.toLowerCase().includes("trực tuyến") ||
                event.location?.toLowerCase().includes("zoom") ||
                event.location?.toLowerCase().includes("meet")));

    return {
        name: event.name || "",
        slug: event.slug || "",
        categoryId: resolveCategoryId(event, categories),
        description: event.description || "",
        eventType: isOnline ? "ONLINE" : "OFFLINE",
        location: event.location || "",
        startAt: toLocalDateTime(event.startAt),
        endAt: toLocalDateTime(event.endAt),
        saleStartAt: toLocalDateTime(event.saleStartAt),
        saleEndAt: toLocalDateTime(event.saleEndAt),
        bannerUrl: event.bannerUrl || "",
        thumbnailUrl: event.thumbnailUrl || "",
        seatMapId: event.seatMapId || event.seatMap?.id || "",
    };
}

function EventFormModal({
    mode = "create",
    event = null,
    open = true,
    categories = [],
    onClose,
    onSuccess,
    onAlert,
    onManageSeatMaps,
    seatMapRefreshKey = 0,
}) {
    const isEdit = mode === "edit";
    const stepContentRef = useRef(null);
    const [activeStep, setActiveStep] = useState(0);
    const steps = ["Thông tin", "Lịch trình", "Hình ảnh"];

    const [formData, setFormData] = useState(() =>
        createInitialFormData(event, isEdit, categories)
    );

    const [bannerFile, setBannerFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [slugError, setSlugError] = useState("");

    const getCategoryId = (category) =>
        String(category?.id ?? category?._id ?? "");
    const categoryId =
        formData.categoryId || resolveCategoryId(event, categories);

    const selectedCategoryExists = categories.some(
        (category) => getCategoryId(category) === String(categoryId)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "name") {
            setFormData((prev) => ({
                ...prev,
                name: value,
                slug: generateSlug(value),
            }));

            setSlugError("");
            return;
        }

        if (name === "slug" && !isEdit) {
            setFormData((prev) => ({
                ...prev,
                slug: generateSlug(value),
            }));

            setSlugError("");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (action) => {
        if (loading) return;

        setSlugError("");

        if (!formData.name.trim()) {
            return onAlert?.("error", "Vui lòng nhập tên sự kiện.");
        }

        if (!formData.slug.trim()) {
            return onAlert?.("error", "Vui lòng nhập slug sự kiện.");
        }

        if (!categoryId) {
            return onAlert?.("error", "Vui lòng chọn danh mục.");
        }

        if (!formData.location.trim()) {
            return onAlert?.(
                "error",
                formData.eventType === "ONLINE"
                    ? "Vui lòng nhập nền tảng hoặc link sự kiện trực tuyến."
                    : "Vui lòng nhập địa điểm tổ chức."
            );
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

            let bannerUrl = formData.bannerUrl || null;
            let thumbnailUrl = formData.thumbnailUrl || null;

            // Upload ảnh banner
            if (bannerFile) {
                const response = await uploadEventImage(
                    bannerFile,
                    "vticket/events"
                );

                bannerUrl = response.data.url;
            }

            // Upload ảnh thumbnail
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
                categoryId,
                eventType: formData.eventType,
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
                seatMapId: formData.seatMapId || null,
            };

            if (isEdit) {
                await updateEvent(event.id, payload);

                if (action === "PENDING") {
                    await submitEvent(event.id);
                    onSuccess?.(
                        "Đã gửi sự kiện đến Admin để phê duyệt."
                    );
                } else {
                    onSuccess?.("Cập nhật sự kiện thành công.");
                }
                return;
            }

            const response = await createEvent(payload);

            if (action === "DRAFT") {
                onSuccess?.("Đã lưu sự kiện dưới dạng bản nháp.");
                return;
            }

            const eventId =
                response?.data?.id ||
                response?.data?.data?.id ||
                response?.data?.event?.id ||
                response?.data?.data?.event?.id;

            if (!eventId) {
                throw new Error(
                    "Tạo sự kiện thành công nhưng không lấy được ID để gửi duyệt."
                );
            }

            // Gửi sự kiện lên Admin duyệt
            await submitEvent(eventId);

            onSuccess?.("Đã gửi sự kiện đến Admin để phê duyệt.");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Không thể tạo sự kiện.";

            // Duplicate slug error
            if (message.toLowerCase().includes("slug")) {
                setSlugError(
                    "Slug đã tồn tại. Vui lòng chọn slug khác."
                );
                setActiveStep(0);
                return;
            }

            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    const validateCurrentStep = () => {
        const fields = stepContentRef.current?.querySelectorAll(
            "input, select, textarea"
        );

        for (const field of fields || []) {
            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setActiveStep((step) => Math.min(step + 1, steps.length - 1));
        }
    };

    const handleAction = (action) => {
        handleSubmit(action);
    };

    if (!open || (isEdit && !event)) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-gray-900">
                        {isEdit ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
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
                    onSubmit={(e) => e.preventDefault()}
                    className="min-h-0 flex-1 overflow-y-auto"
                >
                    <div className="border-b border-gray-100 px-6 py-4">
                        <ol className="flex items-center gap-3">
                            {steps.map((step, index) => (
                                <li
                                    key={step}
                                    className={`flex items-center gap-2 text-sm ${
                                        index === activeStep
                                            ? "font-semibold text-blue-700"
                                            : index < activeStep
                                              ? "text-gray-700"
                                              : "text-gray-400"
                                    }`}
                                >
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                                            index <= activeStep
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {index + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div ref={stepContentRef} className="p-6">
                        {activeStep === 0 && (
                            <section className="mx-auto max-w-3xl space-y-5">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">
                                        Thông tin sự kiện
                                    </h3>
                                </div>
                                <EventBasicInfoSection
                                    formData={{
                                        ...formData,
                                        categoryId: String(categoryId),
                                    }}
                                    handleChange={handleChange}
                                    categories={categories}
                                    selectedCategoryExists={
                                        isEdit ? selectedCategoryExists : true
                                    }
                                    getCategoryId={getCategoryId}
                                    currentCategoryName={
                                        event?.category?.name ||
                                        event?.categoryName ||
                                        ""
                                    }
                                    slugError={slugError}
                                />
                            </section>
                        )}

                        {activeStep === 1 && (
                            <section className="mx-auto max-w-3xl">
                                <EventScheduleSection
                                    formData={formData}
                                    handleChange={handleChange}
                                />
                            </section>
                        )}

                        {activeStep === 2 && (
                            <section className="mx-auto max-w-4xl space-y-5">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">
                                        Hình ảnh sự kiện
                                    </h3>
                                </div>
                                <EventImagesSection
                                    formData={formData}
                                    setFormData={setFormData}
                                    thumbnailFile={thumbnailFile}
                                    setThumbnailFile={setThumbnailFile}
                                    bannerFile={bannerFile}
                                    setBannerFile={setBannerFile}
                                    onAlert={onAlert}
                                    seatMapSection={
                                        <EventSeatMapSection
                                            value={formData.seatMapId}
                                            onChange={(value) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    seatMapId: value,
                                                }))
                                            }
                                            onAlert={onAlert}
                                            onManageSeatMaps={
                                                onManageSeatMaps
                                            }
                                            refreshKey={seatMapRefreshKey}
                                        />
                                    }
                                />
                            </section>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                setActiveStep((step) => Math.max(step - 1, 0))
                            }
                            disabled={loading || activeStep === 0}
                        >
                            <ChevronLeft size={16} />
                            Quay lại
                        </Button>

                        <div className="flex flex-wrap justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy
                            </Button>

                            {activeStep < steps.length - 1 ? (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleNext}
                                    disabled={loading}
                                >
                                    Tiếp tục
                                    <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() =>
                                            handleAction(
                                                isEdit
                                                    ? event.status || "DRAFT"
                                                    : "DRAFT"
                                            )
                                        }
                                        disabled={loading}
                                    >
                                        <Save size={16} />
                                        {loading
                                            ? "Đang xử lý..."
                                            : isEdit
                                              ? "Lưu thay đổi"
                                              : "Lưu nháp"}
                                    </Button>

                                    {(!isEdit ||
                                        event.status === "DRAFT" ||
                                        event.status === "REJECTED") && (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() =>
                                                handleAction("PENDING")
                                            }
                                            disabled={loading}
                                        >
                                            <Send size={16} />
                                            {loading
                                                ? "Đang xử lý..."
                                                : isEdit
                                                  ? "Lưu và gửi phê duyệt"
                                                  : "Gửi phê duyệt"}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventFormModal;
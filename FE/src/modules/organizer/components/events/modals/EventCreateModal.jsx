import { useRef, useState } from "react";
import { X, FileText, Send, Save } from "lucide-react";

import Button from "../../../../../components/common/button/Button";
import {
    createEvent,
    uploadEventImage,
    submitEvent,
} from "../../../services/eventService";
import { generateSlug } from "../../../../../utils/generateSlug";
import EventBasicInfoSection from "./EventBasicInfoSection";
import EventScheduleSection from "./EventScheduleSection";
import EventImagesSection from "./EventImagesSection";
import EventSeatMapSection from "./EventSeatMapSection";

function EventCreateModal({
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
        categoryId: "",
        description: "",
        slug: "",
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
    const [slugError, setSlugError] = useState("");

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

        if (name === "slug") {
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
                categoryId: formData.categoryId,
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

            // Luôn tạo sự kiện ở trạng thái DRAFT
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
            const status =
                error.response?.status ||
                error.statusCode ||
                error.status;

            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Không thể tạo sự kiện.";

            // Duplicate slug error
            if (
                status === 409 ||
                message.toLowerCase().includes("slug")
            ) {
                setSlugError(
                    "Slug đã tồn tại. Vui lòng chọn slug khác."
                );
                return;
            }

            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action) => {
        if (!formRef.current?.reportValidity()) return;
        handleSubmit(action);
    };

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

                            <EventBasicInfoSection
                                formData={formData}
                                handleChange={handleChange}
                                categories={categories}
                                slugError={slugError}
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
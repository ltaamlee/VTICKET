import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import {
    X,
    CalendarDays,
    MapPin,
    Tag,
    Clock,
    FileText,
    Link,
    Send,
    Image as ImageIcon,
    ClipboardCheck,
    Armchair,
    Users,
    Mail,
    Phone,
    ShieldCheck,
    AlertCircle,
    Video,
} from "lucide-react";

import Button from "../../../../components/common/button/Button";
import Tabs from "../../../../components/common/Tabs";
import {
    getEventDetail as getOrganizerEventDetail,
    submitEvent,
} from "../../services/eventService";
import { getSeatMapDetail as getOrganizerSeatMapDetail } from "../../services/seatMapService";
import {
    getEventDetail as getAdminEventDetail,
    getSeatMapDetail as getAdminSeatMapDetail,
} from "../../../admin/services/eventService";

import EventSeatMapTab from "./EventSeatMapTab";

const TAB_INFO = "info";
const TAB_SEAT_MAP = "seat-map";

/**
 * @param {"organizer"|"admin"} scope - Ai đang xem modal.
 *   Admin dùng API riêng (/admin/...) vì không có quyền gọi
 *   route của Organizer.
 */
function EventDetailModal({
    event,
    onClose,
    onSuccess,
    onAlert,
    onApprove,
    onReject,
    showSubmit = true,
    scope = "organizer",
}) {
    const [loading, setLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(event?.status);

    // Danh sách sự kiện chỉ trả về seatMap kèm _count, không có danh sách
    // khu vực. Vì vậy cần tải chi tiết sự kiện để hiển thị khu vực/ghế.
    const [detail, setDetail] = useState(null);

    // Sơ đồ ghế đầy đủ (hình dạng, toạ độ, giá) để vẽ xem trước.
    const [seatMap, setSeatMap] = useState(null);
    const [activeTab, setActiveTab] = useState(TAB_INFO);

    const isAdmin = scope === "admin";

    const fetchEventDetail = isAdmin
        ? getAdminEventDetail
        : getOrganizerEventDetail;

    const fetchSeatMapDetail = isAdmin
        ? getAdminSeatMapDetail
        : getOrganizerSeatMapDetail;

    // Đồng bộ trạng thái khi mở sự kiện khác.
    useEffect(() => {
        setCurrentStatus(event?.status);
        setActiveTab(TAB_INFO);
    }, [event]);

    useEffect(() => {
        if (!event?.id) {
            setDetail(null);
            return;
        }

        let cancelled = false;

        const loadDetail = async () => {
            try {
                const result = await fetchEventDetail(event.id);

                if (cancelled) return;

                setDetail(result?.data || null);
            } catch (error) {
                if (cancelled) return;

                onAlert?.(
                    "error",
                    error.response?.data?.message ||
                        error.message ||
                        "Không thể tải chi tiết sự kiện."
                );
            }
        };

        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [event?.id, fetchEventDetail, onAlert]);

    // Tải sơ đồ ghế đầy đủ (khu vực + hình dạng + toạ độ + giá).
    useEffect(() => {
        const seatMapId =
            detail?.seatMapId || event?.seatMapId || event?.seatMap?.id;

        if (!seatMapId) {
            setSeatMap(null);
            return;
        }

        let cancelled = false;

        const loadSeatMap = async () => {
            try {
                const result = await fetchSeatMapDetail(seatMapId);

                if (cancelled) return;

                setSeatMap(result?.data || null);
            } catch (error) {
                if (cancelled) return;

                // Fallback: dữ liệu sơ đồ đã kèm trong chi tiết sự kiện
                // vẫn đủ để vẽ xem trước.
                setSeatMap(
                    detail?.seatMap || event?.seatMap || null
                );

                // Không chặn modal nếu lỗi sơ đồ, chỉ báo nhẹ cho người dùng.
                onAlert?.(
                    "error",
                    error.response?.data?.message ||
                        error.message ||
                        "Không thể tải sơ đồ ghế."
                );
            }
        };

        loadSeatMap();

        return () => {
            cancelled = true;
        };
    }, [
        detail?.seatMapId,
        event?.seatMapId,
        event?.seatMap?.id,
        fetchSeatMapDetail,
        onAlert,
    ]);

    if (!event) return null;

    // Ưu tiên dữ liệu chi tiết, fallback về dữ liệu trong danh sách.
    const seatMapInfo = detail?.seatMap || event.seatMap;
    const zones = seatMapInfo?.zones || [];

    const statusMap = {
        DRAFT: {
            label: "Bản nháp",
            className: "bg-gray-100 text-gray-600",
            dotClass: "bg-gray-400",
        },
        PENDING: {
            label: "Chờ phê duyệt",
            className: "bg-amber-50 text-amber-700",
            dotClass: "bg-amber-500",
        },
        APPROVED: {
            label: "Đã duyệt",
            className: "bg-emerald-50 text-emerald-700",
            dotClass: "bg-emerald-500",
        },
        REJECTED: {
            label: "Bị từ chối",
            className: "bg-red-50 text-red-600",
            dotClass: "bg-red-500",
        },
        CANCELLED: {
            label: "Đã hủy",
            className: "bg-red-50 text-red-600",
            dotClass: "bg-red-500",
        },
        COMPLETED: {
            label: "Đã kết thúc",
            className: "bg-blue-50 text-blue-700",
            dotClass: "bg-blue-500",
        },
        SUSPENDED: {
            label: "Đã tạm ngưng",
            className: "bg-orange-50 text-orange-700",
            dotClass: "bg-orange-500",
        },
    };

    const status = statusMap[currentStatus] || {
        label: currentStatus || "Chưa xác định",
        className: "bg-gray-100 text-gray-600",
        dotClass: "bg-gray-400",
    };

    // Lưu ý: cần ngoặc để tránh operator precedence làm cho
    // trạng thái REJECTED luôn hiện nút gửi dù showSubmit = false.
    const canSubmit =
        showSubmit &&
        (currentStatus === "DRAFT" || currentStatus === "REJECTED");

    const isPending = currentStatus === "PENDING";

    // Lý do từ chối (nếu có) để Admin/organizer nắm được.
    const rejectReason =
        detail?.rejectReason || event?.rejectReason || "";

    // Ban tổ chức - lấy từ chi tiết trước, fallback về danh sách.
    const organizer =
        detail?.organizer || event?.organizer || null;

    const organizerName =
        organizer?.organizerProfile?.organizationName ||
        organizer?.profile?.fullName ||
        organizer?.username ||
        "—";

    // Định dạng ngày giờ.
    const formatDate = (date) => {
        if (!date) return "Chưa cập nhật";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Chưa cập nhật";
        }

        return new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(parsedDate);
    };

    // Gửi sự kiện đến Admin phê duyệt.
    const handleSubmit = async () => {
        if (loading || !canSubmit) return;

        try {
            setLoading(true);

            await submitEvent(event.id);

            setCurrentStatus("PENDING");

            onSuccess?.("Đã gửi sự kiện đến Admin để phê duyệt.");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Không thể gửi sự kiện để phê duyệt.";

            onAlert?.("error", message);
        } finally {
            setLoading(false);
        }
    };

    // Thành phần hiển thị thông tin.
    const InfoItem = ({ icon: Icon, label, value }) => (
        <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                <Icon size={18} className="text-gray-500" />
            </div>

            <div className="min-w-0 pt-0.5">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-gray-800">
                    {value || "Chưa cập nhật"}
                </p>
            </div>
        </div>
    );

    // Tiêu đề từng khu vực.
    const SectionTitle = ({ icon: Icon, children }) => (
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Icon size={17} className="text-blue-600" />
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
                {children}
            </h4>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Chi tiết sự kiện
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Thông tin chi tiết và trạng thái sự kiện
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
                    >
                        <X size={21} />
                    </button>
                </div>

                {/* TABS */}
                <div className="shrink-0 border-b border-gray-100 px-6">
                    <Tabs
                        tabs={[
                            {
                                id: TAB_INFO,
                                label: "Thông tin sự kiện",
                                icon: FileText,
                            },
                            {
                                id: TAB_SEAT_MAP,
                                label: "Sơ đồ ghế",
                                icon: Armchair,
                            },
                        ]}
                        defaultTab={TAB_INFO}
                        onChange={setActiveTab}
                    />
                </div>

                {/* CONTENT - TAB THÔNG TIN */}
                <div
                    className={`min-h-0 flex-1 space-y-7 overflow-y-auto p-6 ${
                        activeTab === TAB_SEAT_MAP ? "hidden" : ""
                    }`}
                >

                    {/* EVENT OVERVIEW */}
                    <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="h-36 w-36 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            {event.thumbnailUrl ? (
                                <img
                                    src={event.thumbnailUrl}
                                    alt={event.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                                    <ImageIcon size={30} />
                                    <span className="text-xs">
                                        Chưa có thumbnail
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
                            <div>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                                    />
                                    {status.label}
                                </span>
                            </div>

                            <h3 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
                                {event.name}
                            </h3>

                            {event.slug && (
                                <div className="flex min-w-0 items-center gap-2 text-sm text-gray-400">
                                    <Link size={15} className="shrink-0" />
                                    <span className="truncate">
                                        /events/{event.slug}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BANNER */}
                    {event.bannerUrl && (
                        <div className="space-y-3">
                            <SectionTitle icon={ImageIcon}>
                                Ảnh banner
                            </SectionTitle>

                            <div className="overflow-hidden rounded-xl bg-gray-50">
                                <img
                                    src={event.bannerUrl}
                                    alt={`Banner ${event.name}`}
                                    className="max-h-72 w-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* EVENT INFORMATION */}
                    <div className="space-y-4">
                        <SectionTitle icon={FileText}>
                            Thông tin sự kiện
                        </SectionTitle>

                        <div className="grid grid-cols-1 gap-5 rounded-xl bg-gray-50/80 p-5 sm:grid-cols-2">
                            <InfoItem
                                icon={Tag}
                                label="Danh mục"
                                value={
                                    event.category?.name ||
                                    event.categoryName ||
                                    "Chưa phân loại"
                                }
                            />

                            <InfoItem
                                icon={
                                    event.location?.toLowerCase().includes("online") ||
                                    event.location?.toLowerCase().includes("trực tuyến") ||
                                    event.location?.toLowerCase().includes("zoom") ||
                                    event.location?.toLowerCase().includes("meet")
                                        ? Video
                                        : MapPin
                                }
                                label={
                                    event.location?.toLowerCase().includes("online") ||
                                    event.location?.toLowerCase().includes("trực tuyến") ||
                                    event.location?.toLowerCase().includes("zoom") ||
                                    event.location?.toLowerCase().includes("meet")
                                        ? "Hình thức tổ chức"
                                        : "Địa điểm tổ chức"
                                }
                                value={event.location}
                            />
                        </div>
                    </div>

                    {/* BAN TỔ CHỨC - Admin cần xem để duyệt */}
                    {(isAdmin || organizer) && (
                        <div className="space-y-4">
                            <SectionTitle icon={Users}>
                                Ban tổ chức
                            </SectionTitle>

                            <div className="grid grid-cols-1 gap-5 rounded-xl bg-gray-50/80 p-5 sm:grid-cols-2">
                                <InfoItem
                                    icon={Users}
                                    label="Tên đơn vị / người tổ chức"
                                    value={organizerName}
                                />

                                <InfoItem
                                    icon={Mail}
                                    label="Email liên hệ"
                                    value={
                                        organizer?.email ||
                                        event?.contactEmail ||
                                        "—"
                                    }
                                />

                                <InfoItem
                                    icon={Phone}
                                    label="Số điện thoại"
                                    value={
                                        event?.contactPhone ||
                                        organizer?.phone ||
                                        "—"
                                    }
                                />

                                <InfoItem
                                    icon={ShieldCheck}
                                    label="Trạng thái ban tổ chức"
                                    value={
                                        organizer?.organizerProfile
                                            ?.isVerified
                                            ? "Đã xác minh"
                                            : "Chưa xác minh"
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* LÝ DO TỪ CHỐI */}
                    {rejectReason && (
                        <div className="space-y-4">
                            <SectionTitle icon={AlertCircle}>
                                Lý do từ chối
                            </SectionTitle>

                            <div className="rounded-xl border border-red-100 bg-red-50/70 p-5">
                                <p className="whitespace-pre-line text-sm leading-6 text-red-700">
                                    {rejectReason}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* EVENT TIME */}
                    <div className="space-y-4">
                        <SectionTitle icon={CalendarDays}>
                            Thời gian diễn ra
                        </SectionTitle>

                        <div className="grid grid-cols-1 gap-5 rounded-xl bg-gray-50/80 p-5 sm:grid-cols-2">
                            <InfoItem
                                icon={CalendarDays}
                                label="Thời gian bắt đầu"
                                value={formatDate(event.startAt)}
                            />

                            <InfoItem
                                icon={CalendarDays}
                                label="Thời gian kết thúc"
                                value={formatDate(event.endAt)}
                            />
                        </div>
                    </div>

                    {/* SALE TIME */}
                    <div className="space-y-4">
                        <SectionTitle icon={Clock}>
                            Thời gian mở bán vé
                        </SectionTitle>

                        <div className="grid grid-cols-1 gap-5 rounded-xl bg-gray-50/80 p-5 sm:grid-cols-2">
                            <InfoItem
                                icon={Clock}
                                label="Bắt đầu mở bán"
                                value={formatDate(event.saleStartAt)}
                            />

                            <InfoItem
                                icon={Clock}
                                label="Kết thúc mở bán"
                                value={formatDate(event.saleEndAt)}
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="space-y-4">
                        <SectionTitle icon={FileText}>
                            Mô tả sự kiện
                        </SectionTitle>

                        <div className="rounded-xl bg-gray-50/80 p-5">
                            {event.description && /<[a-z][\s\S]*>/i.test(event.description) ? (
                                <div
                                    className="text-sm leading-relaxed text-gray-700 [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-700 [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_h1]:my-2.5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-800 [&_h3]:my-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-800 [&_hr]:my-3 [&_hr]:border-gray-200 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(event.description),
                                    }}
                                />
                            ) : (
                                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                    {event.description || "Chưa có mô tả."}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* APPROVAL INFORMATION */}
                    {isPending && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                            <ClipboardCheck
                                size={20}
                                className="mt-0.5 shrink-0 text-amber-600"
                            />

                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    Sự kiện đang chờ phê duyệt
                                </p>
                                <p className="mt-1 text-xs leading-5 text-amber-700">
                                    {isAdmin
                                        ? "Hãy kiểm tra thông tin, sơ đồ ghế và giá vé trước khi duyệt hoặc từ chối."
                                        : "Sự kiện đã được gửi đến Admin. Vui lòng chờ kết quả xét duyệt."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* TAB: SƠ ĐỒ GHẾ */}
                {activeTab === TAB_SEAT_MAP && (
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                        <EventSeatMapTab seatMap={seatMap} />
                    </div>
                )}

                {/* FOOTER */}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
                    <div className="text-xs text-gray-500">
                        {showSubmit && (
                            isPending
                                ? "Sự kiện đã gửi và đang chờ Admin xét duyệt."
                                : canSubmit
                                    ? "Sự kiện chưa được gửi phê duyệt."
                                    : ""
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Đóng
                        </Button>

                        {canSubmit && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <Send size={16} />
                                {loading ? "Đang gửi..." : "Gửi phê duyệt"}
                            </Button>
                        )}

                        {showSubmit && isPending && (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled
                            >
                                <ClipboardCheck size={16} />
                                Đã gửi phê duyệt
                            </Button>
                        )}

                        {/* ADMIN: duyệt / từ chối ngay trong modal */}
                        {isAdmin && isPending && (
                            <>
                                <Button
                                    type="button"
                                    variant="danger"
                                    onClick={onReject}
                                    disabled={loading}
                                >
                                    <X size={16} />
                                    Từ chối
                                </Button>

                                <Button
                                    type="button"
                                    variant="success"
                                    onClick={onApprove}
                                    disabled={loading}
                                >
                                    <ClipboardCheck size={16} />
                                    Duyệt sự kiện
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventDetailModal;
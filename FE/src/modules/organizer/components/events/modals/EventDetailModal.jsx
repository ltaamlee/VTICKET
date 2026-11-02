
import { useState } from "react";
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
} from "lucide-react";

import Button from "../../../../../components/common/button/Button";
import { updateEvent } from "../../../services/eventService";

function EventDetailModal({
    event,
    onClose,
    onSuccess,
    onAlert,
}) {
    const [loading, setLoading] = useState(false);

    if (!event) return null;

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
        PUBLISHED: {
            label: "Đã xuất bản",
            className: "bg-green-50 text-green-700",
            dotClass: "bg-green-500",
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
    };

    const status = statusMap[event.status] || {
        label: event.status || "Chưa xác định",
        className: "bg-gray-100 text-gray-600",
        dotClass: "bg-gray-400",
    };

    const canSubmitApproval =
        event.status === "DRAFT" || event.status === "REJECTED";

    const handleSubmitApproval = async () => {
        if (loading) return;

        try {
            setLoading(true);

            await updateEvent(event.id, {
                status: "PENDING",
            });

            onSuccess?.("Đã gửi sự kiện đến Admin để phê duyệt.");
        } catch (error) {
            onAlert?.(
                "error",
                error.message || "Không thể gửi sự kiện để phê duyệt."
            );
        } finally {
            setLoading(false);
        }
    };

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
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={21} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-6">

                    {/* EVENT OVERVIEW */}
                    <div className="flex flex-col gap-5 sm:flex-row">
                        {/* THUMBNAIL */}
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

                        {/* BASIC INFO */}
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
                            <div className="flex flex-wrap items-center gap-2">
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
                                icon={MapPin}
                                label="Địa điểm tổ chức"
                                value={event.location}
                            />
                        </div>
                    </div>

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
                            <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                {event.description || "Chưa có mô tả."}
                            </p>
                        </div>
                    </div>

                    {/* APPROVAL INFORMATION */}
                    {event.status === "PENDING" && (
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
                                    Sự kiện đã được gửi đến Admin. Vui lòng
                                    chờ kết quả xét duyệt.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
                    <div className="text-xs text-gray-400">
                        {canSubmitApproval
                            ? "Sự kiện chưa được gửi phê duyệt."
                            : event.status === "PENDING"
                                ? "Đang chờ Admin xét duyệt."
                                : ""}
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

                        {canSubmitApproval && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleSubmitApproval}
                                disabled={loading}
                            >
                                <Send size={16} />
                                {loading
                                    ? "Đang gửi..."
                                    : "Gửi phê duyệt"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventDetailModal;
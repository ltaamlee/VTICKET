import { useEffect, useMemo, useState } from "react";
import {
    Ticket,
    Clock,
    MapPin,
    TrendingDown,
    TrendingUp,
    Repeat2,
} from "lucide-react";

import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../components/common/form/FormPanel";
import CurrencyInput from "../../../components/common/form/CurrencyInput";
import { createResaleListing } from "../services/resaleService";
import {
    RESALE_MAX_PRICE,
    formatResalePrice,
} from "../constants/resaleConstants";

/**
 * ResaleForm - Modal đăng tin bán lại vé.
 * Hiển thị thông tin vé được chọn, gợi ý nhanh các mức giá và
 * cho phép nhập giá bán lại tùy ý.
 */
export default function ResaleForm({ ticket, onClose, onSuccess, onError }) {
    const [price, setPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (ticket) {
            setPrice(0);
            setError("");
        }
    }, [ticket]);

    const event = ticket?.event || {};
    const ticketType = ticket?.ticketType || {};
    const seat = ticket?.seat;
    const originalPrice = Number(ticketType.price || 0);

    // Các mức giá gợi ý dựa trên giá gốc
    const suggestions = useMemo(() => {
        if (!originalPrice) return [];
        return [
            { label: "70%", value: Math.round(originalPrice * 0.7) },
            { label: "85%", value: Math.round(originalPrice * 0.85) },
            { label: "100%", value: originalPrice },
        ];
    }, [originalPrice]);

    if (!ticket) return null;

    const isOverMax = price > RESALE_MAX_PRICE;

    const diffPercent = originalPrice
        ? Math.round(((price - originalPrice) / originalPrice) * 100)
        : 0;

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!price || price <= 0) {
            setError("Vui lòng nhập giá bán lại lớn hơn 0.");
            return;
        }

        if (isOverMax) {
            setError(
                `Giá bán không được vượt quá ${RESALE_MAX_PRICE.toLocaleString(
                    "vi-VN"
                )} đ.`
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            await createResaleListing({
                ticketId: ticket.id,
                price,
            });

            onSuccess?.("Đăng bán vé thành công! Vé của bạn đã lên sàn.");
        } catch (err) {
            const message =
                err.message || "Không thể đăng bán vé. Vui lòng thử lại.";
            setError(message);
            onError?.(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormPanel
            icon={Repeat2}
            title="Đăng bán lại vé"
            subtitle="Chọn mức giá bán cho vé này của bạn"
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitText="Đăng bán vé"
        >
            {/* Thông tin vé */}
            <div className="flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {event.thumbnailUrl ? (
                    <img
                        src={event.thumbnailUrl}
                        alt={event.name || "Sự kiện"}
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white text-gray-300">
                        <Ticket className="h-8 w-8" />
                    </div>
                )}

                <div className="min-w-0 flex-1 space-y-1 text-xs text-gray-600">
                    <p className="line-clamp-2 text-sm font-bold text-gray-900">
                        {event.name || "Sự kiện"}
                    </p>
                    <p className="font-semibold text-gray-700">
                        {ticketType.name || "Vé điện tử"}
                    </p>
                    {ticketType.session?.startAt && (
                        <p className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {new Date(ticketType.session.startAt).toLocaleString(
                                "vi-VN"
                            )}
                        </p>
                    )}
                    {event.location && (
                        <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="line-clamp-1">{event.location}</span>
                        </p>
                    )}
                    {seat && (
                        <p className="font-semibold text-gray-700">
                            Ghế {seat.rowLabel}
                            {seat.seatNumber}
                            {seat.zone?.name ? ` · ${seat.zone.name}` : ""}
                        </p>
                    )}
                </div>
            </div>

            {/* Giá gốc + gợi ý */}
            {originalPrice > 0 && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-blue-700">
                            Giá vé gốc
                        </span>
                        <span className="font-semibold text-blue-700">
                            {formatResalePrice(originalPrice)}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                disabled={loading}
                                onClick={() => setPrice(item.value)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed ${
                                    price === item.value
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                                }`}
                            >
                                {item.label} · {formatResalePrice(item.value)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Giá bán lại */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>Giá bán lại</label>
                <div className="relative">
                    <CurrencyInput
                        id="resale-price"
                        value={price}
                        onChange={setPrice}
                        disabled={loading}
                        placeholder="Nhập giá bán lại"
                        className={`${FORM_PANEL_INPUT_CLASS} pr-14`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                        đ
                    </span>
                </div>

                {price > 0 && !isOverMax && (
                    <p
                        className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                            diffPercent < 0
                                ? "text-emerald-600"
                                : diffPercent === 0
                                ? "text-gray-500"
                                : "text-amber-600"
                        }`}
                    >
                        {diffPercent < 0 ? (
                            <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                            <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {diffPercent === 0
                            ? "Bằng đúng giá gốc"
                            : diffPercent < 0
                            ? `Thấp hơn giá gốc ${Math.abs(
                                  diffPercent
                              )}% — bán nhanh hơn`
                            : `Cao hơn giá gốc ${diffPercent}%`}
                    </p>
                )}
            </div>
        </FormPanel>
    );
}

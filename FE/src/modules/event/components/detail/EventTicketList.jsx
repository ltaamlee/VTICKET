import { Ticket } from "lucide-react";

export default function EventTicketList({ ticketTypes: allTicketTypes = [], quantities = {}, onQuantityChange, maxTickets = 10, disabled = false, onBuy, buying = false, error = "", manualSeats = false, readOnly = false, now }) {
    // Khu vực sân khấu không bán vé nên không hiển thị giá.
    const ticketTypes = (allTicketTypes || []).filter(
        (ticket) => ticket.zone?.type !== "STAGE"
    );

    if (ticketTypes.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Chưa có loại vé mở bán</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Ban tổ chức hiện chưa công bố danh sách vé cho sự kiện này. Vui lòng quay lại sau!
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-blue-600" />
                    Thông tin hạng vé
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    Bảng giá và thông tin các hạng vé tham dự sự kiện
                </p>
            </div>

            <div className="space-y-3.5">
                {ticketTypes.map((ticket) => {
                    const isSoldOut = ticket.isSoldOut;
                    const unavailable = isSoldOut || ticket.status !== "ACTIVE" ||
                        (ticket.saleStartAt && new Date(ticket.saleStartAt).getTime() > now) ||
                        (ticket.saleEndAt && new Date(ticket.saleEndAt).getTime() <= now);
                    const otherQuantity = Object.entries(quantities).reduce((sum, [id, quantity]) => sum + (id === ticket.id ? 0 : quantity), 0);
                    const limit = Math.max(0, Math.min(maxTickets - otherQuantity, ticket.remainingQuantity));
                    const priceFormatted = Number(ticket.price) === 0
                        ? "Miễn phí"
                        : `${Number(ticket.price).toLocaleString("vi-VN")} đ`;

                    return (
                        <div
                            key={ticket.id}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border transition ${
                                isSoldOut
                                    ? "border-slate-200 bg-slate-50/70 opacity-60"
                                    : "border-slate-200/90 hover:border-blue-300 bg-white hover:shadow-xs"
                            }`}
                        >
                            <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                    <h3 className="font-bold text-base text-slate-900">{ticket.name}</h3>

                                    {unavailable ? (
                                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20">
                                            {isSoldOut ? "Hết vé" : "Không mở bán"}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                            Còn vé
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-baseline sm:items-center justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                                <div className="sm:text-right">
                                    <span className="text-base sm:text-lg font-bold text-blue-600 tracking-tight">
                                        {priceFormatted}
                                    </span>
                                    {!readOnly && (manualSeats && ticket.zone?.type === "SEATED" ? (
                                        <p className="mt-2 text-sm text-slate-600">Đã chọn {quantities[ticket.id] || 0} ghế</p>
                                    ) : <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                        Số lượng
                                        <select
                                            aria-label={`Số lượng ${ticket.name}`}
                                            value={quantities[ticket.id] || 0}
                                            disabled={disabled || unavailable || buying}
                                            onChange={(e) => onQuantityChange(ticket.id, Number(e.target.value))}
                                            className="rounded-lg border border-slate-300 px-2 py-1"
                                        >
                                            {Array.from({ length: limit + 1 }, (_, count) => (
                                                <option key={count} value={count}>{count}</option>
                                            ))}
                                        </select>
                                    </label>)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {!readOnly && <><p className="text-sm text-slate-500">Tối đa {maxTickets} vé mỗi đơn. Vé được giữ trong 15 phút.</p>
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            <button type="button" disabled={disabled || buying || !Object.values(quantities).some(Boolean)} onClick={onBuy}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {buying ? "Đang giữ vé..." : "Tiếp tục đặt vé"}
            </button></>}
        </div>
    );
}

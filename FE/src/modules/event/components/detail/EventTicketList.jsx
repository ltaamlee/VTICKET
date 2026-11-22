import { Ticket, Clock } from "lucide-react";

/**
 * EventTicketList - Bảng danh sách các loại vé đang phát hành của sự kiện
 */
export default function EventTicketList({ ticketTypes: allTicketTypes = [] }) {
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
                    "Các hạng vé đang mở bán"
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    Bảng giá và thông tin các hạng vé tham dự sự kiện
                </p>
            </div>

            <div className="space-y-3.5">
                {ticketTypes.map((ticket) => {
                    const isSoldOut = ticket.isSoldOut;
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

                                    {isSoldOut ? (
                                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20">
                                            Hết vé
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                            Còn vé
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    {ticket.saleEndAt && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            Đóng bán: {new Date(ticket.saleEndAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-baseline sm:items-center justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                                <div className="sm:text-right">
                                    <span className="text-base sm:text-lg font-bold text-blue-600 tracking-tight">
                                        {priceFormatted}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

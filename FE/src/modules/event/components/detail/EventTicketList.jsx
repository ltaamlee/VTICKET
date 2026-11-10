import { Ticket, Users, Clock, AlertCircle } from "lucide-react";

/**
 * EventTicketList - Bảng danh sách các loại vé đang phát hành của sự kiện
 */
export default function EventTicketList({ ticketTypes = [], onSelectTicket }) {
    if (!ticketTypes || ticketTypes.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-xs">
                <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">Chưa có loại vé mở bán</h3>
                <p className="mt-1 text-xs text-gray-500">
                    Ban tổ chức hiện chưa công bố danh sách vé cho sự kiện này. Vui lòng quay lại sau!
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-blue-600" />
                    Các hạng vé đang mở bán
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                    Chọn hạng vé phù hợp để tiến hành đặt vé tham dự sự kiện
                </p>
            </div>

            <div className="space-y-4">
                {ticketTypes.map((ticket) => {
                    const isSoldOut = ticket.remainingQuantity <= 0;
                    const priceFormatted = Number(ticket.price) === 0
                        ? "Miễn phí"
                        : `${Number(ticket.price).toLocaleString("vi-VN")} đ`;

                    return (
                        <div
                            key={ticket.id}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border transition ${
                                isSoldOut
                                    ? "border-gray-200 bg-gray-50/70 opacity-70"
                                    : "border-gray-200 hover:border-blue-400 hover:shadow-md bg-white"
                            }`}
                        >
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2.5">
                                    <h3 className="font-bold text-base text-gray-900">{ticket.name}</h3>

                                    {ticket.zone && (
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10">
                                            Khu vực: {ticket.zone.name}
                                        </span>
                                    )}

                                    {isSoldOut ? (
                                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                            Hết vé
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                            Còn vé
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                        Còn lại: <strong className="text-gray-700">{ticket.remainingQuantity}</strong> vé
                                    </span>

                                    {ticket.saleEndAt && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            Đóng bán: {new Date(ticket.saleEndAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                                <div className="text-right">
                                    <span className="block text-lg font-black text-blue-600">
                                        {priceFormatted}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    disabled={isSoldOut}
                                    onClick={() => onSelectTicket && onSelectTicket(ticket)}
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {isSoldOut ? "Hết vé" : "Mua vé ngay"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


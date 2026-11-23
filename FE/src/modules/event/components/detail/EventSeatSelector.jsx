import { useEffect, useState } from "react";
import { getAvailableSeats } from "../../services/eventService";
import { lettersToRowLabel } from "../../../../utils/seats/seatKeys";

function groupSeats(seats) {
    const rows = new Map();
    for (const seat of seats) {
        if (!rows.has(seat.rowLabel)) rows.set(seat.rowLabel, []);
        rows.get(seat.rowLabel).push(seat);
    }
    return [...rows.entries()].sort(([a], [b]) =>
        (lettersToRowLabel(a) || Number(a) || 0) - (lettersToRowLabel(b) || Number(b) || 0)
    ).map(([row, rowSeats]) => [
        row,
        [...rowSeats].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, "vi", { numeric: true })),
    ]);
}

export default function EventSeatSelector({ eventId, sessionId, selected, onToggle, onRefresh, disabled, refreshKey }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getAvailableSeats(eventId, sessionId)
            .then((response) => {
                if (!cancelled) {
                    setGroups(response.data);
                    setError("");
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || "Không thể tải danh sách ghế");
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [eventId, sessionId, refreshKey]);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900">Chọn ghế của bạn</h2>
            <p className="mt-2 text-sm text-slate-500">Danh sách theo hàng, không thể hiện vị trí chính xác trên sơ đồ. Ghế màu xám không khả dụng; ghế chỉ được giữ sau khi bạn tiếp tục đặt vé. Cập nhật tình trạng sẽ xóa lựa chọn ghế hiện tại.</p>
            <button type="button" onClick={onRefresh} className="mt-2 text-sm font-semibold text-blue-600">Cập nhật tình trạng ghế</button>
            {loading && <p className="mt-4 text-sm text-slate-500">Đang tải ghế...</p>}
            {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
            {!loading && !error && groups.length === 0 && <p className="mt-4 text-sm text-slate-500">Không có khu vực ghế để chọn.</p>}
            {!error && groups.map((group) => (
                <div key={group.ticketTypeId} className="mt-5">
                    <h3 className="mb-3 font-semibold text-slate-800">{group.zoneName}</h3>
                    <div className="space-y-2 overflow-x-auto">
                        {groupSeats(group.seats).map(([row, seats]) => (
                            <div key={row} className="flex min-w-max items-center gap-2">
                                <span className="w-8 shrink-0 text-xs font-semibold text-slate-500">{row}</span>
                                {seats.map((seat) => {
                                    const isSelected = (selected[group.ticketTypeId] || []).includes(seat.id);
                                    return (
                                        <button key={seat.id} type="button" aria-pressed={isSelected}
                                            disabled={disabled || (!seat.available && !isSelected)}
                                            onClick={() => onToggle(group.ticketTypeId, seat.id)}
                                            className={`min-w-12 rounded-lg border px-2 py-2 text-xs font-semibold ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-700"} disabled:cursor-not-allowed disabled:opacity-40`}>
                                            {seat.rowLabel}{seat.seatNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}

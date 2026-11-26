import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import SeatMapPreview from "../../../organizer/seatmaps/components/SeatMapPreview";
import { getAvailableSeats } from "../../services/eventService";

function isAvailable(type, now) {
    return type.status === "ACTIVE" && !type.isSoldOut &&
        (!type.saleStartAt || new Date(type.saleStartAt).getTime() <= now) &&
        (!type.saleEndAt || new Date(type.saleEndAt).getTime() > now);
}

function money(value) {
    return Number(value).toLocaleString("vi-VN") + " đ";
}

export default function EventBookingWorkspace({
    event, eventPath, sessions, selectedSession, onSelectSession, ticketTypes,
    quantities, selectedSeats, onQuantityChange, onSeatToggle, onRefreshSeats,
    onBuy, buying, error, disabled, maxTickets, now, pendingOrderId, orderStatus, expired, onRestart,
}) {
    const [activeTypeId, setActiveTypeId] = useState("");
    const [groups, setGroups] = useState([]);
    const [loadingSeats, setLoadingSeats] = useState(event.seatSelectionMode === "MANUAL");
    const [seatError, setSeatError] = useState("");
    const [zoom, setZoom] = useState(100);
    const manual = event.seatSelectionMode === "MANUAL";
    const types = useMemo(() => ticketTypes.filter((type) => type.zone?.type !== "STAGE"), [ticketTypes]);

    useEffect(() => {
        if (!manual) return;
        let cancelled = false;
        getAvailableSeats(event.id, selectedSession?.id)
            .then((response) => {
                if (!cancelled) {
                    setGroups(response.data);
                    setLoadingSeats(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setSeatError(err.message || "Không thể tải tình trạng ghế");
                    setLoadingSeats(false);
                }
            });
        return () => { cancelled = true; };
    }, [event.id, manual, selectedSession?.id]);

    const activeType = types.find((type) => type.id === activeTypeId);
    const totalCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
    const total = types.reduce((sum, type) => sum + (quantities[type.id] || 0) * Number(type.price), 0);

    const zones = {};
    for (const zone of event.seatMap?.zones || []) {
        const zoneTypes = types.filter((type) => type.zoneId === zone.id);
        if (!zoneTypes.length || zone.type === "STAGE") continue;
        const availableTypes = zoneTypes.filter((type) => isAvailable(type, now));
        const preferred = availableTypes.find((type) => type.id === activeTypeId) || availableTypes[0];
        const group = groups.find((entry) => entry.ticketTypeId === preferred?.id);
        const seats = {};
        for (const seat of group?.seats || []) {
            const selectedType = zoneTypes.find((type) => (selectedSeats[type.id] || []).includes(seat.id));
            const type = selectedType || preferred;
            const selected = Boolean(selectedType);
            seats[`${seat.rowLabel}|${seat.seatNumber}`] = {
                id: seat.id, typeId: type?.id, label: `${zone.name} ${seat.rowLabel}${seat.seatNumber}`,
                available: seat.available, selected,
                canSelect: Boolean(type && (selected || (seat.available && isAvailable(type, now)))),
            };
        }
        zones[zone.id] = {
            enabled: availableTypes.length > 0,
            active: activeType?.zoneId === zone.id,
            seats,
        };
    }

    function selectZone(zoneId) {
        const candidates = types.filter((type) => type.zoneId === zoneId && isAvailable(type, now));
        const chosen = candidates.find((type) => type.id === activeTypeId) || candidates[0];
        if (chosen) setActiveTypeId(chosen.id);
    }

    const interaction = {
        mode: manual ? "MANUAL" : "AUTO", zones, disabled: disabled || buying,
        seatsDisabled: loadingSeats || Boolean(seatError),
        onZoneSelect: selectZone,
        onSeatToggle: (seat) => {
            setActiveTypeId(seat.typeId);
            onSeatToggle(seat.typeId, seat.id);
        },
    };

    return (
        <main className="flex flex-1 flex-col bg-black text-white lg:flex-row">
            <section className="relative min-w-0 flex-1 px-4 pb-8 pt-5">
                <div className="flex items-start justify-between gap-4">
                    <Link to={eventPath} className="text-sm font-bold text-emerald-400">← Trở về</Link>
                    <div className="text-center">
                        <h1 className="font-bold text-emerald-400">{manual ? "Chọn ghế hoặc khu vực" : "Chọn khu vực"}</h1>
                        <p className="mt-1 text-xs text-slate-300">{manual ? "Bấm vào ghế hoặc khu vực để chọn vé" : "Bấm vào khu vực để chọn vé"}</p>
                    </div>
                    <span className="w-16" />
                </div>
                {manual && <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                    <span>⚪ Đang trống</span><span className="text-emerald-400">● Đang chọn</span><span className="text-red-400">● Không chọn được</span>
                </div>}
                <div className="mt-4 flex items-center gap-2">
                    <button type="button" aria-label="Thu nhỏ sơ đồ" onClick={() => setZoom((value) => Math.max(100, value - 50))} className="rounded-full border border-emerald-500 p-1 text-emerald-400"><Minus size={18} /></button>
                    <button type="button" aria-label="Đặt lại kích thước sơ đồ" onClick={() => setZoom(100)} className="rounded-full border border-emerald-500 p-1 text-emerald-400"><RotateCcw size={18} /></button>
                    <button type="button" aria-label="Phóng to sơ đồ" onClick={() => setZoom((value) => Math.min(300, value + 50))} className="rounded-full border border-emerald-500 p-1 text-emerald-400"><Plus size={18} /></button>
                    {manual && <button type="button" onClick={onRefreshSeats} disabled={buying} className="ml-2 text-xs text-emerald-400 disabled:opacity-50">Cập nhật ghế</button>}
                </div>
                {loadingSeats && <p className="mt-3 text-center text-sm text-slate-300">Đang tải tình trạng ghế...</p>}
                {seatError && <p role="alert" className="mt-3 text-center text-sm text-red-400">{seatError}. Hãy cập nhật ghế để thử lại.</p>}
                {event.seatMap ? (
                    <div className="mt-3 overflow-auto">
                        <div style={{ width: `${zoom}%` }} className="mx-auto">
                            <SeatMapPreview seatMap={event.seatMap} showCapacity={false}
                                className="!border-0 !bg-transparent"
                                bookingInteraction={interaction} />
                        </div>
                    </div>
                ) : <p className="mt-12 text-center text-sm text-slate-300">Sự kiện không có sơ đồ. Chọn hạng vé trong bảng giá.</p>}
            </section>

            <aside className="flex w-full shrink-0 flex-col bg-[#303035] lg:min-h-[calc(100vh-64px)] lg:w-96">
                <div className="bg-[#222226] px-5 py-4 font-bold">{event.name}</div>
                <div className="space-y-4 border-b border-white/10 px-5 py-4 text-sm">
                    {sessions.length > 0 ? (
                        <label className="block">
                            <span className="mb-2 flex items-center gap-2"><CalendarDays size={18} /> Suất diễn</span>
                            <select aria-label="Chọn suất diễn" value={selectedSession?.id || ""} disabled={buying}
                                onChange={(e) => onSelectSession(sessions.find((session) => session.id === e.target.value))}
                                className="w-full rounded border border-slate-500 bg-[#222226] p-2 text-white">
                                {sessions.map((session) => <option key={session.id} value={session.id} disabled={session.ticketStatus !== "SELLING"}>{new Date(session.startAt).toLocaleString("vi-VN")} · {session.ticketStatus === "SELLING" ? "Đang bán" : "Không mở bán"}</option>)}
                            </select>
                        </label>
                    ) : <p className="flex items-center gap-2"><CalendarDays size={18} /> {new Date(event.startAt).toLocaleString("vi-VN")}</p>}
                    <p className="flex items-start gap-2"><MapPin size={18} className="shrink-0 text-emerald-400" /> {event.location || "Địa điểm đang cập nhật"}</p>
                </div>
                <div className="flex-1 px-5 py-5">
                    <h2 className="mb-4 text-sm font-bold">Giá vé</h2>
                    {types.length === 0 && <p className="text-sm text-slate-300">Chưa có hạng vé.</p>}
                    <div className="space-y-2">
                        {types.map((type) => {
                            const available = isAvailable(type, now);
                            const quantity = quantities[type.id] || 0;
                            const selectSeats = manual && type.zone?.type === "SEATED";
                            const selectedForType = selectedSeats[type.id] || [];
                            const nextSeat = selectSeats && groups.find((group) => group.ticketTypeId === type.id)?.seats?.find(
                                (seat) => seat.available && !Object.values(selectedSeats).some((seats) => seats.includes(seat.id))
                            );
                            return <div key={type.id} className={`rounded p-2 text-xs transition ${activeTypeId === type.id ? "bg-white/15 ring-1 ring-emerald-400" : "hover:bg-white/10"}`}>
                                <button type="button" disabled={disabled || buying || !available}
                                    onClick={() => setActiveTypeId(type.id)}
                                    className="flex w-full items-center gap-2 text-left disabled:opacity-50">
                                    <span className="h-5 w-8 shrink-0 rounded" style={{ backgroundColor: type.zone?.color || event.seatMap?.zones?.find((zone) => zone.id === type.zoneId)?.color || "#64748b" }} />
                                    <span className="min-w-0 flex-1 font-semibold">{type.name}{!available ? " · Không mở bán" : ""}</span>
                                    <span className="font-semibold text-emerald-400">{money(type.price)}</span>
                                </button>
                                <div className="mt-3 flex justify-end">
                                    <div className="flex items-center gap-2">
                                        <button type="button" aria-label={`Giảm số lượng ${type.name}`}
                                            disabled={disabled || buying || !available || quantity === 0}
                                            onClick={() => {
                                                setActiveTypeId(type.id);
                                                if (selectSeats) onSeatToggle(type.id, selectedForType[selectedForType.length - 1]);
                                                else onQuantityChange(type.id, quantity - 1);
                                            }}
                                            className="rounded border border-slate-500 p-1 disabled:opacity-40"><Minus size={16} /></button>
                                        <span aria-label={`Số lượng ${type.name}`} className="min-w-6 text-center">{quantity}</span>
                                        <button type="button" aria-label={`Tăng số lượng ${type.name}`}
                                            disabled={disabled || buying || !available || (selectSeats && (loadingSeats || Boolean(seatError) || !nextSeat)) || (quantity >= type.remainingQuantity && totalCount < maxTickets)}
                                            onClick={() => {
                                                setActiveTypeId(type.id);
                                                if (selectSeats) onSeatToggle(type.id, nextSeat.id);
                                                else onQuantityChange(type.id, quantity + 1);
                                            }}
                                            className="rounded border border-emerald-500 bg-emerald-600 p-1 disabled:opacity-40"><Plus size={16} /></button>
                                    </div>
                                </div>
                            </div>;
                        })}
                    </div>
                    <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                        {types.filter((type) => quantities[type.id] > 0).map((type) => {
                            const group = groups.find((entry) => entry.ticketTypeId === type.id);
                            const labels = (group?.seats || []).filter((seat) => (selectedSeats[type.id] || []).includes(seat.id)).map((seat) => `${seat.rowLabel}${seat.seatNumber}`);
                            return <div key={type.id}>
                                <div className="flex justify-between gap-2"><span>{type.name} × {quantities[type.id]}</span><span>{money(Number(type.price) * quantities[type.id])}</span></div>
                                {labels.length > 0 && <p className="mt-1 text-xs text-slate-300">Ghế: {labels.join(", ")}</p>}
                            </div>;
                        })}
                        {totalCount > 0 && <div className="flex justify-between border-t border-white/10 pt-3 font-bold"><span>Tổng cộng</span><span>{money(total)}</span></div>}
                    </div>
                    {pendingOrderId && !expired && <p className="mt-3 text-sm text-amber-300">{orderStatus === "PAID" ? "Đơn hàng đã hoàn tất." : "Bạn đã có đơn đang giữ vé. Tiếp tục thanh toán đơn này trước khi chọn lại."}</p>}
                    {expired && <p role="alert" className="mt-3 text-sm text-amber-300">Lượt mua vé đã hết thời gian. Hãy bắt đầu lại.</p>}
                    {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
                </div>
                <div className="bg-[#222226] p-4">
                    {expired ? <button type="button" onClick={onRestart} className="w-full rounded bg-emerald-500 px-4 py-3 text-sm font-bold text-white">Bắt đầu lại</button>
                        : pendingOrderId ? <><Link to={`/orders/${encodeURIComponent(pendingOrderId)}`} className="block w-full rounded bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-white">{orderStatus === "PAID" ? "Xem đơn hàng ›" : "Tiếp tục thanh toán ›"}</Link>
                            {orderStatus === "PAID" && <button type="button" onClick={onRestart} className="mt-3 w-full text-sm text-emerald-400">Mua vé khác</button>}</>
                            : <button type="button" onClick={onBuy} disabled={disabled || buying || totalCount === 0}
                                className="w-full rounded bg-emerald-500 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300">
                                {buying ? "Đang giữ vé..." : totalCount ? "Tiếp tục đặt vé ›" : "Vui lòng chọn vé ›"}
                            </button>}
                </div>
            </aside>
        </main>
    );
}

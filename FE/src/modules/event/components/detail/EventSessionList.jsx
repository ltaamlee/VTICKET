import { CalendarDays, Check, Clock } from "lucide-react";

function formatTime(value) {
    return new Date(value).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getSessionStatus(session, ticketStatus) {
    if (new Date(session.endAt) <= new Date()) {
        return { label: "Đã kết thúc", className: "bg-slate-100 text-slate-500", disabled: true };
    }
    if (ticketStatus === "ENDED") {
        return { label: "Ngừng bán", className: "bg-slate-100 text-slate-500", disabled: true };
    }
    if (ticketStatus === "SOLD_OUT") {
        return { label: "Hết vé", className: "bg-rose-50 text-rose-700", disabled: true };
    }
    if (ticketStatus === "UPCOMING") {
        return { label: "Sắp mở bán", className: "bg-amber-50 text-amber-700", disabled: false };
    }
    if (ticketStatus === "UNANNOUNCED") {
        return { label: "Chưa công bố mở bán", className: "bg-slate-100 text-slate-500", disabled: false };
    }
    if (ticketStatus !== "SELLING") {
        return { label: "Chưa công bố mở bán", className: "bg-slate-100 text-slate-500", disabled: false };
    }
    return { label: "Đang mở bán", className: "bg-emerald-50 text-emerald-700", disabled: false };
}


export default function EventSessionList({
    sessions = [],
    selectedSessionId,
    onSelectSession,
    ticketStatus,
    disabled = false,
}) {
    if (sessions.length === 0) return null;

    const sortedSessions = [...sessions].sort(
        (a, b) => new Date(a.startAt) - new Date(b.startAt)
    );

    return (
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <div>
                    <h2 className="font-bold text-gray-900">Chọn suất diễn</h2>
                    <p className="text-xs text-gray-500">
                        Sự kiện có {sessions.length} suất diễn
                    </p>
                </div>
            </div>

            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                {sortedSessions.map((session) => {
                    const date = new Date(session.startAt);
                    const status = getSessionStatus(session, session.ticketStatus || ticketStatus);
                    const isSelected = session.id === selectedSessionId;

                    return (
                        <li
                            key={session.id}
                            className={`flex flex-wrap items-center gap-4 p-4 transition ${isSelected ? "bg-blue-50/60" : "bg-white"
                                }`}
                        >
                            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600 text-white">
                                <span className="text-[10px] font-medium uppercase">
                                    {date.toLocaleDateString("vi-VN", { month: "short" })}
                                </span>
                                <span className="text-xl font-black leading-none">
                                    {date.getDate()}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    {formatTime(session.startAt)} - {formatTime(session.endAt)}
                                </p>
                                <p className="mt-0.5 text-xs capitalize text-gray-500">
                                    {date.toLocaleDateString("vi-VN", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                            >
                                {status.label}
                            </span>

                            <button
                                type="button"
                                disabled={disabled || status.disabled}
                                onClick={() => onSelectSession?.(session)}
                                className={`inline-flex min-w-28 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isSelected
                                        ? "bg-blue-600 text-white"
                                        : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                                    }`}
                            >
                                {isSelected && <Check className="h-4 w-4" />}
                                {isSelected ? "Đã chọn" : "Chọn suất"}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

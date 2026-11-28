import { CalendarDays } from "lucide-react";

const VN_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function toVnDate(date = new Date()) {
    return VN_DATE_FORMAT.format(date);
}

function shiftDays(dateStr, delta) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

export function getDefaultDateRange(days = 7) {
    const endDate = toVnDate();
    return {
        startDate: shiftDays(endDate, -(days - 1)),
        endDate,
    };
}

export default function DateRangeFilter({ value, onChange }) {
    const today = toVnDate();
    const startDate = value?.startDate || "";
    const endDate = value?.endDate || "";

    const applyPreset = (days) => {
        onChange?.(getDefaultDateRange(days));
    };

    const applyThisMonth = () => {
        const current = toVnDate();
        onChange?.({
            startDate: `${current.slice(0, 8)}01`,
            endDate: current,
        });
    };

    const isPresetActive = (days) => {
        const preset = getDefaultDateRange(days);
        return startDate === preset.startDate && endDate === preset.endDate;
    };

    const isMonthActive =
        startDate === `${today.slice(0, 8)}01` && endDate === today;

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pr-1">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
                <span>Khoảng ngày</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => applyPreset(7)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isPresetActive(7)
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    7 ngày
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset(30)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isPresetActive(30)
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    30 ngày
                </button>
                <button
                    type="button"
                    onClick={applyThisMonth}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isMonthActive
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    Tháng này
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-l border-slate-200 pl-2">
                <input
                    type="date"
                    aria-label="Từ ngày"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => {
                        const nextStart = event.target.value;
                        if (!nextStart) return;
                        onChange?.({
                            startDate: nextStart,
                            endDate: endDate && nextStart > endDate ? nextStart : endDate,
                        });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">→</span>
                <input
                    type="date"
                    aria-label="Đến ngày"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => {
                        const nextEnd = event.target.value;
                        if (!nextEnd) return;
                        onChange?.({
                            startDate: startDate && nextEnd < startDate ? nextEnd : startDate,
                            endDate: nextEnd,
                        });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-indigo-500"
                />
            </div>
        </div>
    );
}

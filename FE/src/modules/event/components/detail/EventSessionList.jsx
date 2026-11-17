import { useMemo } from "react";
import { CalendarDays, Clock, Ticket } from "lucide-react";

function getDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function EventSessionList({
    sessions = [],
    selectedSessionId,
    onSelectSession,
}) {
    const dateGroups = useMemo(() => {
        const groups = new Map();

        [...sessions]
            .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
            .forEach((session) => {
                const key = getDateKey(session.startAt);
                const group = groups.get(key) || {
                    key,
                    date: new Date(session.startAt),
                    sessions: [],
                };
                group.sessions.push(session);
                groups.set(key, group);
            });

        return [...groups.values()];
    }, [sessions]);

    const selectedGroup =
        dateGroups.find((group) =>
            group.sessions.some((session) => session.id === selectedSessionId)
        ) || dateGroups[0];
    const activeGroup = selectedGroup;

    if (sessions.length === 0) return null;

    return (
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <div>
                    <h2 className="font-bold text-gray-900">Chọn ngày và suất diễn</h2>
                    <p className="text-xs text-gray-500">
                        {sessions.length} suất diễn
                    </p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {dateGroups.map((group) => {
                    const isActive = group.key === activeGroup?.key;

                    return (
                        <button
                            key={group.key}
                            type="button"
                            onClick={() => {
                                onSelectSession?.(group.sessions[0]);
                            }}
                            className={`min-w-24 rounded-xl border px-3 py-2 text-center transition ${
                                isActive
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-gray-200 text-gray-700 hover:border-blue-300"
                            }`}
                        >
                            <span className="block text-xs font-medium">
                                {group.date.toLocaleDateString("vi-VN", {
                                    weekday: "short",
                                })}
                            </span>
                            <span className="block text-sm font-bold">
                                {group.date.toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                })}
                            </span>
                            <span className="block text-[11px] text-gray-500">
                                {group.sessions.length} suất
                            </span>
                        </button>
                    );
                })}
            </div>

            {activeGroup && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {activeGroup.sessions.map((session) => {
                        const isSelected = session.id === selectedSessionId;
                        const isPast = new Date(session.endAt) <= new Date();

                        return (
                            <button
                                key={session.id}
                                type="button"
                                disabled={isPast}
                                onClick={() => onSelectSession?.(session)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                    isSelected
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-gray-200 text-gray-700 hover:border-blue-400"
                                } disabled:cursor-not-allowed disabled:opacity-45`}
                            >
                                <Clock className="h-4 w-4" />
                                {formatTime(session.startAt)} - {formatTime(session.endAt)}
                                <span className="inline-flex items-center gap-1 text-xs opacity-80">
                                    <Ticket className="h-3.5 w-3.5" />
                                    {session.ticketTypes?.length || 0}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

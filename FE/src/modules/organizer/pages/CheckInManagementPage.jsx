import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
    Camera,
    CameraOff,
    Check,
    CheckCircle2,
    CircleAlert,
    LoaderCircle,
    QrCode,
    Search,
    Ticket,
    Users,
} from "lucide-react";

import Pagination from "../../../components/common/Pagination";
import StatCard from "../../../components/common/stats/StatCard";
import { getEvents } from "../services/eventService";
import {
    checkInByQr,
    checkInTicket,
    getEventSessions,
    getEventTickets,
    getEventTicketStats,
} from "../services/ticketService";

const PAGE_SIZE = 20;

const CHECKIN_FILTERS = [
    { value: "", label: "Tất cả vé" },
    { value: "ISSUED", label: "Chưa check-in" },
    { value: "CHECKED_IN", label: "Đã check-in" },
];

function getTicketOwner(ticket) {
    return ticket?.user?.profile?.fullName || ticket?.user?.email || "Khách hàng";
}

function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN");
}

function CheckInManagementPage() {
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState("");
    const [eventsLoading, setEventsLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const [qrToken, setQrToken] = useState("");
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const qrInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanningRef = useRef(false);
    const lastScanRef = useRef({ token: "", at: 0 });

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("ISSUED");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [processingTicketId, setProcessingTicketId] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadEvents() {
            setEventsLoading(true);
            try {
                const firstResponse = await getEvents({ page: 1 });
                const firstData = firstResponse.data;
                const firstEvents = firstData?.events;
                if (!Array.isArray(firstEvents)) {
                    throw new Error("Dữ liệu sự kiện trả về không hợp lệ.");
                }

                const totalEventPages = Math.max(
                    1,
                    Number(firstData?.pagination?.totalPages) || 1
                );
                const remainingPages = await Promise.all(
                    Array.from({ length: totalEventPages - 1 }, (_, index) =>
                        getEvents({ page: index + 2 })
                    )
                );
                const allEvents = [
                    ...firstEvents,
                    ...remainingPages.flatMap((response) => response.data?.events || []),
                ];

                if (!cancelled) {
                    setEvents(allEvents);
                    setEventId((current) => current || allEvents[0]?.id || "");
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError.message || "Không thể tải danh sách sự kiện."
                    );
                }
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        }

        loadEvents();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!eventId) {
            setSessions([]);
            setSessionId("");
            return;
        }
        let cancelled = false;
        setSessionsLoading(true);
        getEventSessions(eventId)
            .then((response) => {
                if (cancelled) return;
                const list = Array.isArray(response.data) ? response.data : [];
                setSessions(list);
                setSessionId(list[0]?.id || "");
            })
            .catch(() => {
                if (!cancelled) {
                    setSessions([]);
                    setSessionId("");
                }
            })
            .finally(() => {
                if (!cancelled) setSessionsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId]);

    const loadTickets = useCallback(async () => {
        if (!eventId) return null;
        const [ticketResponse, statsResponse] = await Promise.all([
            getEventTickets(eventId, {
                page,
                pageSize: PAGE_SIZE,
                keyword,
                status,
                sessionId: sessions.length ? sessionId : "",
            }),
            getEventTicketStats(eventId),
        ]);
        return {
            tickets: ticketResponse.data?.tickets || [],
            totalPages: ticketResponse.data?.pagination?.totalPages || 1,
            stats: statsResponse.data,
        };
    }, [eventId, page, keyword, status, sessionId, sessions.length]);

    useEffect(() => {
        if (!eventId || sessionsLoading) return;
        let cancelled = false;
        setLoading(true);
        loadTickets()
            .then((result) => {
                if (!cancelled && result) {
                    setTickets(result.tickets);
                    setTotalPages(result.totalPages);
                    setStats(result.stats);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(
                        requestError.message || "Không thể tải danh sách vé check-in."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId, sessionsLoading, loadTickets, refreshKey]);

    const activeSessionId = sessions.length ? sessionId || null : null;

    const submitQrToken = useCallback(async (rawToken) => {
        const trimmed = String(rawToken || "").trim();
        if (!trimmed || !eventId || scanningRef.current) return;
        if (sessions.length && !activeSessionId) {
            setScanResult({
                ok: false,
                message: "Vui lòng chọn suất diễn trước khi check-in.",
            });
            return;
        }

        scanningRef.current = true;
        setScanning(true);
        setScanResult(null);
        try {
            const response = await checkInByQr(eventId, {
                sessionId: activeSessionId,
                qrToken: trimmed,
            });
            const ticket = response.data;
            setScanResult({
                ok: true,
                message: `Check-in thành công vé ${ticket?.ticketCode || ""}`,
                ticket,
            });
            setQrToken("");
            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setScanResult({
                ok: false,
                message: requestError.message || "Check-in thất bại.",
            });
        } finally {
            scanningRef.current = false;
            setScanning(false);
        }
    }, [eventId, sessions.length, activeSessionId]);

    useEffect(() => {
        if (!cameraActive) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Trình duyệt không hỗ trợ truy cập camera (cần HTTPS hoặc localhost).");
            setCameraActive(false);
            return;
        }

        let cancelled = false;
        let rafId = 0;

        async function startCamera() {
            setCameraError("");
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = stream;
                const video = videoRef.current;
                if (!video) return;
                video.srcObject = stream;
                await video.play();

                let lastDecodeAt = 0;
                const tick = (timestamp) => {
                    if (cancelled) return;
                    const canvas = canvasRef.current;
                    if (
                        timestamp - lastDecodeAt >= 180 &&
                        video.readyState === video.HAVE_ENOUGH_DATA &&
                        canvas
                    ) {
                        lastDecodeAt = timestamp;
                        const vw = video.videoWidth;
                        const vh = video.videoHeight;
                        if (vw && vh) {
                            const scale = Math.min(1, 640 / Math.max(vw, vh));
                            const width = Math.round(vw * scale);
                            const height = Math.round(vh * scale);
                            if (canvas.width !== width) canvas.width = width;
                            if (canvas.height !== height) canvas.height = height;
                            const ctx = canvas.getContext("2d", { willReadFrequently: true });
                            ctx.drawImage(video, 0, 0, width, height);
                            const imageData = ctx.getImageData(0, 0, width, height);
                            const code = jsQR(imageData.data, width, height, {
                                inversionAttempts: "dontInvert",
                            });
                            if (code?.data) {
                                const detected = code.data.trim();
                                const now = Date.now();
                                if (
                                    !scanningRef.current &&
                                    (detected !== lastScanRef.current.token ||
                                        now - lastScanRef.current.at > 2500)
                                ) {
                                    lastScanRef.current = { token: detected, at: now };
                                    setQrToken(detected);
                                    submitQrToken(detected);
                                }
                            }
                        }
                    }
                    rafId = requestAnimationFrame(tick);
                };
                rafId = requestAnimationFrame(tick);
            } catch (err) {
                if (!cancelled) {
                    setCameraError(
                        err.name === "NotAllowedError"
                            ? "Bạn đã từ chối quyền truy cập camera."
                            : err.name === "NotFoundError"
                              ? "Không tìm thấy thiết bị camera."
                              : "Không thể mở camera để quét mã QR."
                    );
                    setCameraActive(false);
                }
            }
        }

        startCamera();

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [cameraActive, submitQrToken]);

    const handleQrCheckIn = async (event) => {
        event.preventDefault();
        await submitQrToken(qrToken);
        qrInputRef.current?.focus();
    };

    const handleRowCheckIn = async (ticket) => {
        setProcessingTicketId(ticket.id);
        setScanResult(null);
        try {
            const targetSessionId = ticket.ticketType?.sessionId ?? activeSessionId;
            const response = await checkInTicket(ticket.id, targetSessionId);
            setScanResult({
                ok: true,
                message: `Check-in thành công vé ${response.data?.ticketCode || ticket.ticketCode}`,
                ticket: response.data,
            });
            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setScanResult({
                ok: false,
                message: requestError.message || "Không thể check-in vé.",
            });
        } finally {
            setProcessingTicketId("");
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        const nextKeyword = keywordInput.trim();
        if (nextKeyword === keyword && page === 1) return;
        setPage(1);
        setKeyword(nextKeyword);
    };

    const soldCount = stats?.sold ?? 0;
    const checkedInCount = stats?.checkedIn ?? 0;
    const issuedCount = stats?.issued ?? 0;
    const checkInRate = soldCount ? Math.round((checkedInCount / soldCount) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý check-in
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quét mã QR hoặc check-in thủ công theo từng suất diễn.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="w-full sm:w-64">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Sự kiện
                        </span>
                        <select
                            value={eventId}
                            onChange={(event) => {
                                setEventId(event.target.value);
                                setPage(1);
                                setScanResult(null);
                            }}
                            disabled={eventsLoading || !events.length}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                        >
                            {events.length ? (
                                events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.name}
                                    </option>
                                ))
                            ) : (
                                <option value="">
                                    {eventsLoading
                                        ? "Đang tải sự kiện..."
                                        : "Chưa có sự kiện"}
                                </option>
                            )}
                        </select>
                    </label>

                    {sessions.length > 0 && (
                        <label className="w-full sm:w-64">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Suất diễn
                            </span>
                            <select
                                value={sessionId}
                                onChange={(event) => {
                                    setSessionId(event.target.value);
                                    setPage(1);
                                    setScanResult(null);
                                }}
                                disabled={sessionsLoading}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                {sessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {formatDateTime(session.startAt)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            {eventId && (
                <>
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Tổng vé đã bán"
                            value={soldCount}
                            icon={Ticket}
                            bg="bg-sky-50"
                            iconBg="bg-sky-500"
                            loading={loading}
                        />
                        <StatCard
                            label="Đã check-in"
                            value={checkedInCount}
                            icon={CheckCircle2}
                            bg="bg-emerald-50"
                            iconBg="bg-emerald-500"
                            loading={loading}
                        />
                        <StatCard
                            label="Chưa check-in"
                            value={issuedCount}
                            icon={Users}
                            bg="bg-amber-50"
                            iconBg="bg-amber-500"
                            loading={loading}
                        />
                        <StatCard
                            label="Tỷ lệ check-in"
                            value={`${checkInRate}%`}
                            icon={QrCode}
                            bg="bg-indigo-50"
                            iconBg="bg-indigo-500"
                            loading={loading}
                        />
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                                    <QrCode className="h-5 w-5 text-indigo-600" />
                                    Quét mã QR check-in
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Bật camera để đưa mã QR vào khung quét, hoặc nhập thủ công chuỗi mã QR thuộc suất diễn đang chọn.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCameraActive((prev) => !prev)}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                    cameraActive
                                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                            >
                                {cameraActive ? (
                                    <>
                                        <CameraOff className="h-4 w-4" />
                                        Tắt camera
                                    </>
                                ) : (
                                    <>
                                        <Camera className="h-4 w-4" />
                                        Bật camera quét QR
                                    </>
                                )}
                            </button>
                        </div>

                        {cameraError && (
                            <div
                                role="alert"
                                className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                            >
                                <CircleAlert className="h-4 w-4 shrink-0" />
                                {cameraError}
                            </div>
                        )}

                        {cameraActive && (
                            <div className="mt-4 flex flex-col items-center">
                                <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-indigo-500/40 bg-slate-950 aspect-square">
                                    <video
                                        ref={videoRef}
                                        muted
                                        playsInline
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="h-56 w-56 rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
                                    </div>
                                    <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
                                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white">
                                            {scanning ? "Đang xác thực vé..." : "Đưa mã QR vào giữa khung"}
                                        </span>
                                    </div>
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}

                        <form
                            onSubmit={handleQrCheckIn}
                            className="mt-4 flex flex-col gap-3 sm:flex-row"
                        >
                            <input
                                ref={qrInputRef}
                                value={qrToken}
                                onChange={(event) => setQrToken(event.target.value)}
                                placeholder="Hoặc nhập / quét mã QR token bằng đầu đọc..."
                                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                            <button
                                type="submit"
                                disabled={scanning || !qrToken.trim()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {scanning ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Check-in QR
                            </button>
                        </form>

                        {scanResult && (
                            <div
                                role="alert"
                                className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
                                    scanResult.ok
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                            >
                                {scanResult.ok ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                ) : (
                                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                )}
                                <div>
                                    <p className="font-semibold">{scanResult.message}</p>
                                    {scanResult.ticket?.checkInAt && (
                                        <p className="mt-0.5 text-xs">
                                            Thời gian check-in: {formatDateTime(scanResult.ticket.checkInAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <h2 className="font-semibold text-slate-900">
                                Danh sách vé check-in
                            </h2>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={keywordInput}
                                            onChange={(event) =>
                                                setKeywordInput(event.target.value)
                                            }
                                            placeholder="Tìm mã vé..."
                                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        Tìm
                                    </button>
                                </form>

                                <select
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(event.target.value);
                                        setPage(1);
                                    }}
                                    aria-label="Lọc trạng thái check-in"
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                >
                                    {CHECKIN_FILTERS.map((filter) => (
                                        <option key={filter.value || "all"} value={filter.value}>
                                            {filter.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="m-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
                            >
                                <CircleAlert className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">STT</th>
                                        <th className="px-5 py-3 font-semibold">Mã vé</th>
                                        <th className="px-5 py-3 font-semibold">Khách hàng</th>
                                        <th className="px-5 py-3 font-semibold">Loại vé</th>
                                        <th className="px-5 py-3 font-semibold">Chỗ ngồi</th>
                                        <th className="px-5 py-3 font-semibold">Trạng thái</th>
                                        <th className="px-5 py-3 font-semibold">Thời gian check-in</th>
                                        <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-5 py-12 text-center text-slate-500"
                                            >
                                                <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                                                <span className="mt-2 block">Đang tải danh sách...</span>
                                            </td>
                                        </tr>
                                    ) : tickets.length ? (
                                        tickets.map((ticket, index) => (
                                            <tr key={ticket.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-4 text-slate-500">
                                                    {(page - 1) * PAGE_SIZE + index + 1}
                                                </td>
                                                <td className="px-5 py-4 font-mono font-semibold text-slate-900">
                                                    {ticket.ticketCode}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700">
                                                    {getTicketOwner(ticket)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700">
                                                    {ticket.ticketType?.name || "—"}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {ticket.seat
                                                        ? `${ticket.seat.zone?.name || ""} ${ticket.seat.rowLabel || ""}${ticket.seat.seatNumber || ""}`.trim()
                                                        : "Không chọn ghế"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            ticket.status === "CHECKED_IN"
                                                                ? "bg-indigo-50 text-indigo-700"
                                                                : ticket.status === "ISSUED"
                                                                  ? "bg-emerald-50 text-emerald-700"
                                                                  : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {ticket.status === "CHECKED_IN"
                                                            ? "Đã check-in"
                                                            : ticket.status === "ISSUED"
                                                              ? "Chưa check-in"
                                                              : ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {formatDateTime(ticket.checkInAt)}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {ticket.status === "ISSUED" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRowCheckIn(ticket)}
                                                            disabled={processingTicketId === ticket.id}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                                        >
                                                            {processingTicketId === ticket.id ? (
                                                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                            Check-in
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-5 py-12 text-center text-slate-500"
                                            >
                                                Không có vé phù hợp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={(nextPage) => setPage(nextPage)}
                        />
                    </section>
                </>
            )}
        </div>
    );
}

export default CheckInManagementPage;

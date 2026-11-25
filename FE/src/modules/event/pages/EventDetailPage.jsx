import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../../../layout/Header"
import Footer from "../../../layout/Footer";
import EventDetailHeader from "../components/detail/EventDetailHeader";
import EventInfoTabs from "../components/detail/EventInfoTabs";
import EventDescription from "../components/detail/EventDescription";
import EventTicketList from "../components/detail/EventTicketList";
import EventSessionList from "../components/detail/EventSessionList";
import EventSeatMapPreview from "../components/detail/EventSeatMapPreview";
import EventBookingWorkspace from "../components/detail/EventBookingWorkspace";
import EventOrganizerCard from "../components/detail/EventOrganizerCard";
import EventBookingSidebar from "../components/detail/EventBookingSidebar";
import { getEventDetail } from "../services/eventService";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { createOrder } from "../../ticket/services/orderService";
import useBookingSession, { resetBookingOnEventPage } from "../../ticket/services/useBookingSession";
import BookingCountdown from "../../ticket/components/BookingCountdown";


export default function EventDetailPage({ booking = false }) {
    const { idOrSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const [resetError, setResetError] = useState("");
    const canBuy = !isAuthenticated || user?.role === "USER";
    const requestedSessionId = booking ? new URLSearchParams(location.search).get("session") : null;

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(() => new URLSearchParams(location.search).has("booking") ? "tickets" : "overview");
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [selectedSeats, setSelectedSeats] = useState({});
    const [seatRefreshKey, setSeatRefreshKey] = useState(0);
    const [detailRefreshKey, setDetailRefreshKey] = useState(0);
    const [buying, setBuying] = useState(false);
    const buyingRef = useRef(false);
    const [bookingError, setBookingError] = useState("");
    const [now, setNow] = useState(() => Date.now());
    const bookingSession = useBookingSession(booking ? event?.id : null, user?.id, now);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), booking ? 1000 : 30000);
        return () => clearInterval(timer);
    }, [booking]);

    useEffect(() => {
        if (!booking) return;
        const clearRestoredSelection = (event) => {
            if (event.persisted) {
                setQuantities({});
                setSelectedSeats({});
                setBookingError("");
                setSeatRefreshKey((current) => current + 1);
            }
        };
        window.addEventListener("pageshow", clearRestoredSelection);
        return () => window.removeEventListener("pageshow", clearRestoredSelection);
    }, [booking]);

    useEffect(() => {
        let isMounted = true;

        async function fetchDetail() {
            setLoading(true);
            setError(null);

            try {
                let res = await getEventDetail(idOrSlug);
                if (!booking && user?.id) {
                    try {
                        const cancelled = await resetBookingOnEventPage(res.data.id, user.id);
                        if (cancelled) res = await getEventDetail(idOrSlug);
                        if (isMounted) setResetError("");
                    } catch (err) {
                        if (isMounted) setResetError(err.message || "Không thể hủy lượt mua trước đó");
                    }
                }
                if (isMounted) {
                    setEvent(res.data);
                    setQuantities({});
                    setSelectedSeats({});
                    setBookingError("");
                    const sessions = res.data?.sessions || [];
                    const now = new Date();
                    const initialSession =
                        sessions.find((session) => session.id === requestedSessionId) ||
                        sessions.find((session) => session.ticketStatus === "SELLING" && new Date(session.endAt) > now) ||
                        sessions.find((session) => new Date(session.endAt) > now) ||
                        sessions[0];
                    setSelectedSessionId(initialSession?.id || null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Không thể tải thông tin chi tiết sự kiện");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        if (idOrSlug) {
            fetchDetail();
        }

        return () => {
            isMounted = false;
        };
    }, [idOrSlug, requestedSessionId, detailRefreshKey, booking, user?.id]);

    const handleBuyClick = () => {
        const query = selectedSessionId ? `?session=${encodeURIComponent(selectedSessionId)}` : "";
        navigate(`/events/${encodeURIComponent(idOrSlug)}/booking${query}`);
    };

    const handleOrder = async () => {
        if (buyingRef.current || !bookingSession.session || bookingSession.expired || bookingSession.session.orderId) return;
        if (!isAuthenticated) {
            navigate("/login", { state: { from: location.pathname + location.search } });
            return;
        }
        const availableTypes = event.sessions?.length
            ? event.sessions.find((session) => session.id === selectedSessionId)?.ticketTypes || []
            : event.ticketTypes || [];
        const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0)
            .map(([ticketTypeId, quantity]) => ({
                ticketTypeId,
                quantity,
                ...(event.seatSelectionMode === "MANUAL" && availableTypes.find((type) => type.id === ticketTypeId)?.zone?.type === "SEATED"
                    ? { seatIds: selectedSeats[ticketTypeId] || [] }
                    : {}),
            }));
        const maxTickets = Math.min(event.maxTicketsPerOrder ?? 10, 10);
        if (items.reduce((sum, item) => sum + item.quantity, 0) > maxTickets) {
            setBookingError(`Mỗi đơn được mua tối đa ${maxTickets} vé.`);
            return;
        }
        buyingRef.current = true;
        setBuying(true);
        setBookingError("");
        try {
            const response = await createOrder({ eventId: event.id, sessionId: selectedSessionId, items, bookingToken: bookingSession.session.token });
            let storageError = "";
            try {
                bookingSession.rememberOrder(response.data);
            } catch (err) {
                storageError = `Không thể lưu lượt mua trên trình duyệt: ${err.message}. Hãy dùng trang đơn hàng để tiếp tục.`;
            }
            navigate(`/orders/${response.data.id}`, { state: { storageError } });
        } catch (err) {
            setBookingError(err.message || "Không thể giữ vé, vui lòng thử lại.");
            if (event.seatSelectionMode === "MANUAL") {
                const seated = new Set(availableTypes.filter((type) => type.zone?.type === "SEATED").map((type) => type.id));
                setSelectedSeats({});
                setQuantities((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !seated.has(id))));
                setSeatRefreshKey((current) => current + 1);
            }
        } finally {
            buyingRef.current = false;
            setBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        <p className="text-sm font-semibold text-gray-500">Đang tải thông tin sự kiện...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center px-4 py-20">
                    <div className="max-w-md w-full rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Không tìm thấy sự kiện
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {error || "Sự kiện này không tồn tại hoặc chưa được Ban tổ chức công bố."}
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/events"
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Khám phá các sự kiện khác
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const sessions = event.sessions || [];
    const selectedSession =
        sessions.find((session) => session.id === selectedSessionId) || null;
    const ticketTypes = sessions.length ? selectedSession?.ticketTypes || [] : event.ticketTypes || [];
    const bookingDisabled = event.ticketStatus !== "SELLING" || (selectedSession && selectedSession.ticketStatus !== "SELLING");
    const maxTickets = Math.min(event.maxTicketsPerOrder ?? 10, 10);

    const handleSeatToggle = (ticketTypeId, seatId) => {
        const current = selectedSeats[ticketTypeId] || [];
        const isSelected = current.includes(seatId);
        const total = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
        if (!isSelected && Object.entries(selectedSeats).some(([id, seats]) => id !== ticketTypeId && seats.includes(seatId))) {
            setBookingError("Ghế này đã được chọn ở hạng vé khác.");
            return;
        }
        const type = ticketTypes.find((entry) => entry.id === ticketTypeId);
        if (!isSelected && current.length >= (type?.remainingQuantity || 0)) {
            setBookingError("Hạng vé này không còn đủ số lượng.");
            return;
        }
        if (!isSelected && total >= maxTickets) {
            setBookingError(`Mỗi đơn được mua tối đa ${maxTickets} vé.`);
            return;
        }
        const next = isSelected ? current.filter((id) => id !== seatId) : [...current, seatId];
        setSelectedSeats((value) => ({ ...value, [ticketTypeId]: next }));
        setQuantities((value) => ({ ...value, [ticketTypeId]: next.length }));
        setBookingError("");
    };

    const refreshSeats = () => {
        const seated = new Set(ticketTypes.filter((type) => type.zone?.type === "SEATED").map((type) => type.id));
        setSelectedSeats({});
        setQuantities((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !seated.has(id))));
        setSeatRefreshKey((current) => current + 1);
    };

    if (booking) {
        if (bookingSession.loading) return <div className="min-h-screen bg-slate-50"><Header /><p className="p-8">Đang bắt đầu lượt mua vé...</p></div>;
        if (!bookingSession.session) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-8"><p role="alert" className="text-rose-600">{bookingSession.error}</p><button type="button" onClick={bookingSession.restart} className="mt-4 text-blue-600">Thử lại</button></div></div>;
        const orderLocked = Boolean(bookingSession.session.orderId && !bookingSession.expired);
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                {bookingSession.orderStatus !== "PAID" && <BookingCountdown expiresAt={bookingSession.session.expiresAt} now={bookingSession.clockNow + bookingSession.session.offset} />}
                <EventBookingWorkspace key={`${event.id}-${selectedSessionId || "event"}-${seatRefreshKey}-${bookingSession.expired}`}
                    event={event} eventPath={`/events/${encodeURIComponent(idOrSlug)}`}
                    sessions={sessions} selectedSession={selectedSession}
                    onSelectSession={(session) => {
                        setSelectedSessionId(session.id);
                        setQuantities({});
                        setSelectedSeats({});
                        setBookingError("");
                    }}
                    ticketTypes={ticketTypes} quantities={bookingSession.expired ? {} : quantities} selectedSeats={bookingSession.expired ? {} : selectedSeats}
                    onQuantityChange={(id, quantity) => {
                        setQuantities((current) => ({ ...current, [id]: quantity }));
                        setBookingError("");
                    }}
                    onSeatToggle={handleSeatToggle} onRefreshSeats={refreshSeats} onBuy={handleOrder}
                    disabled={bookingDisabled || bookingSession.expired || orderLocked} buying={buying} error={bookingError || bookingSession.error}
                    expired={bookingSession.expired}
                    pendingOrderId={orderLocked ? bookingSession.session.orderId : null}
                    orderStatus={bookingSession.orderStatus}
                    onRestart={async () => {
                        if (await bookingSession.restart()) {
                            setQuantities({});
                            setSelectedSeats({});
                            setBookingError("");
                            setSeatRefreshKey((current) => current + 1);
                            setDetailRefreshKey((current) => current + 1);
                        }
                    }}
                    maxTickets={maxTickets} now={now} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            {resetError && <div role="alert" className="mx-auto mt-4 w-full max-w-7xl px-4 text-sm text-rose-700">
                Không thể hủy lượt mua trước đó: {resetError}. <button type="button" className="font-semibold underline" onClick={() => setDetailRefreshKey((value) => value + 1)}>Thử lại</button>
            </div>}
            <EventDetailHeader event={event} onBuyClick={handleBuyClick} canBuy={canBuy} blocked={Boolean(resetError)} />

            {/* Thanh Tab điều hướng nội dung */}
            <EventInfoTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hasSeatMap={Boolean(event.seatMap)}
            />

            {/* Thân trang: Nội dung chi tiết & Khung đặt vé nổi */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Cột trái (8 cột): Nội dung chi tiết theo Tab */}
                    <div className="lg:col-span-8 space-y-8">
                        {activeTab === "overview" && (
                            <EventDescription
                                description={event.description}
                                contactEmail={event.contactEmail}
                                contactPhone={event.contactPhone}
                            />
                        )}

                        {activeTab === "tickets" && (
                            <div id="tickets-section" className="space-y-6">
                                {sessions.length > 0 && (
                                    <EventSessionList
                                        sessions={sessions}
                                        selectedSessionId={selectedSession?.id}
                                        ticketStatus={event.ticketStatus}
                                        onSelectSession={(session) => {
                                            setSelectedSessionId(session.id);
                                            setQuantities({});
                                            setSelectedSeats({});
                                            setBookingError("");
                                        }}
                                    />
                                )}
                                {event.seatMap && (
                                    <EventSeatMapPreview seatMap={event.seatMap} />
                                )}
                                <EventTicketList
                                    ticketTypes={ticketTypes}
                                    readOnly now={now}
                                />
                            </div>
                        )}

                        {activeTab === "organizer" && (
                            <EventOrganizerCard organizer={event.organizer} />
                        )}
                    </div>

                    {/* Cột phải (4 cột): Sidebar đặt vé nổi */}
                    <div className="lg:col-span-4">
                        <EventBookingSidebar
                            event={event}
                            onBuyClick={handleBuyClick}
                            selectedSession={selectedSession}
                            canBuy={canBuy}
                            blocked={Boolean(resetError)}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../../../layout/Header"
import Footer from "../../../layout/Footer";
import EventDetailHeader from "../components/detail/EventDetailHeader";
import EventInfoTabs from "../components/detail/EventInfoTabs";
import EventDescription from "../components/detail/EventDescription";
import EventTicketList from "../components/detail/EventTicketList";
import EventSessionList from "../components/detail/EventSessionList";
import EventSeatMapPreview from "../components/detail/EventSeatMapPreview";
import EventSeatSelector from "../components/detail/EventSeatSelector";
import EventOrganizerCard from "../components/detail/EventOrganizerCard";
import EventBookingSidebar from "../components/detail/EventBookingSidebar";
import { getEventDetail } from "../services/eventService";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { createOrder } from "../../ticket/services/orderService";


export default function EventDetailPage() {
    const { idOrSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(() => new URLSearchParams(location.search).has("booking") ? "tickets" : "overview");
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [selectedSeats, setSelectedSeats] = useState({});
    const [seatRefreshKey, setSeatRefreshKey] = useState(0);
    const [buying, setBuying] = useState(false);
    const [bookingError, setBookingError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function fetchDetail() {
            setLoading(true);
            setError(null);

            try {
                const res = await getEventDetail(idOrSlug);
                if (isMounted) {
                    setEvent(res.data);
                    setQuantities({});
                    setSelectedSeats({});
                    setBookingError("");
                    const sessions = res.data?.sessions || [];
                    const now = new Date();
                    const initialSession =
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
    }, [idOrSlug]);

    const handleBuyClick = () => {
        setActiveTab("tickets");
        window.setTimeout(() => {
            document
                .getElementById("tickets-section")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    };

    const handleOrder = async () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: `${location.pathname}?booking=1` } });
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
        setBuying(true);
        setBookingError("");
        try {
            const response = await createOrder({ eventId: event.id, sessionId: selectedSessionId, items });
            navigate(`/orders/${response.data.id}`);
        } catch (err) {
            setBookingError(err.message || "Không thể giữ vé, vui lòng thử lại.");
            if (event.seatSelectionMode === "MANUAL") {
                const seated = new Set(availableTypes.filter((type) => type.zone?.type === "SEATED").map((type) => type.id));
                setSelectedSeats({});
                setQuantities((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !seated.has(id))));
                setSeatRefreshKey((current) => current + 1);
            }
        } finally {
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <EventDetailHeader event={event} onBuyClick={handleBuyClick} />

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
                                {event.seatSelectionMode === "MANUAL" && (!sessions.length || selectedSession) && (
                                    <EventSeatSelector
                                        key={`${event.id}-${selectedSessionId || "event"}-${seatRefreshKey}`}
                                        eventId={event.id}
                                        sessionId={selectedSessionId}
                                        selected={selectedSeats}
                                        onToggle={handleSeatToggle}
                                        onRefresh={refreshSeats}
                                        disabled={bookingDisabled || buying}
                                        refreshKey={seatRefreshKey}
                                    />
                                )}
                                <EventTicketList
                                    ticketTypes={ticketTypes}
                                    quantities={quantities}
                                    maxTickets={maxTickets}
                                    disabled={bookingDisabled}
                                    manualSeats={event.seatSelectionMode === "MANUAL"}
                                    onQuantityChange={(id, quantity) => {
                                        setQuantities((current) => ({ ...current, [id]: quantity }));
                                        setBookingError("");
                                    }}
                                    onBuy={handleOrder}
                                    buying={buying}
                                    error={bookingError}
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
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

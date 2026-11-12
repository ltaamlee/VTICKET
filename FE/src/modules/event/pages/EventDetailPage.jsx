import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../../layout/Header"
import Footer from "../../../layout/Footer";
import EventDetailHeader from "../components/detail/EventDetailHeader";
import EventInfoTabs from "../components/detail/EventInfoTabs";
import EventDescription from "../components/detail/EventDescription";
import EventTicketList from "../components/detail/EventTicketList";
import EventSeatMapPreview from "../components/detail/EventSeatMapPreview";
import EventOrganizerCard from "../components/detail/EventOrganizerCard";
import EventBookingSidebar from "../components/detail/EventBookingSidebar";
import { getEventDetail } from "../services/eventService";
import { AlertCircle, ArrowLeft } from "lucide-react";

/**
 * EventDetailPage - Trang xem thông tin chi tiết sự kiện (/events/:idOrSlug)
 * Tách biệt từng khối chức năng thành các component con độc lập.
 */
export default function EventDetailPage() {
    const { idOrSlug } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        let isMounted = true;

        async function fetchDetail() {
            setLoading(true);
            setError(null);

            try {
                const res = await getEventDetail(idOrSlug);
                if (isMounted) {
                    setEvent(res.data);
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
        const element = document.getElementById("tickets-section");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
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
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
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
                            <div id="tickets-section">
                                <EventTicketList
                                    ticketTypes={event.ticketTypes}
                                    onSelectTicket={() => { }}
                                />
                            </div>
                        )}

                        {activeTab === "seatmap" && (
                            <EventSeatMapPreview seatMap={event.seatMap} />
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
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}


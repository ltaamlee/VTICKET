import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import ForumPostFeed from "../components/ForumPostFeed";
import ForumSidebar from "../components/ForumSidebar";
import ForumNotice from "../components/ForumNotice";
import { useTaggableEvents } from "../hooks/useTaggableEvents";

function ForumListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const feedRef = useRef(null);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const keyword = searchParams.get("keyword") || "";
    const eventId = searchParams.get("eventId") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const mine = isAuthenticated && searchParams.get("mine") === "true";
    const liked = isAuthenticated && searchParams.get("liked") === "true";

    const [pageNotice, setPageNotice] = useState(null);

    // Trạng thái mở / ẩn của sidebar (lưu trong localStorage để ghi nhớ)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem("vticket_forum_sidebar_open");
        return saved !== null ? saved === "true" : true;
    });

    const handleToggleSidebar = useCallback(() => {
        setIsSidebarOpen((prev) => {
            const next = !prev;
            localStorage.setItem("vticket_forum_sidebar_open", String(next));
            return next;
        });
    }, []);

    const { events: taggableEvents } = useTaggableEvents({ limit: 50 });

    const showNotice = useCallback((message, type = "info") => {
        setPageNotice({ message, type });
    }, []);

    const dismissNotice = useCallback(() => {
        setPageNotice(null);
    }, []);

    const updateFilters = useCallback(
        (updates, { resetPage = true } = {}) => {
            const next = new URLSearchParams(searchParams);
            Object.entries(updates).forEach(([key, val]) => {
                if (val === "" || val === false || val === null || val === undefined) {
                    next.delete(key);
                } else {
                    next.set(key, String(val));
                }
            });
            if (resetPage) {
                next.delete("page");
            }
            setSearchParams(next);
        },
        [searchParams, setSearchParams]
    );

    const handleClearFilters = () => {
        setSearchParams(new URLSearchParams());
    };

    const hasActiveFilters = Boolean(keyword || eventId || mine || liked || sortBy !== "newest");

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />

            <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-1">
                {/* Nút Toggle mở lại Sidebar khi bị ẩn (nằm sát mép trái màn hình) */}
                {!isSidebarOpen && (
                    <button
                        type="button"
                        onClick={handleToggleSidebar}
                        title="Mở thanh điều hướng"
                        aria-label="Mở thanh điều hướng"
                        className="fixed left-3 top-20 z-30 hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <line x1="4" y1="8" x2="20" y2="8" />
                            <line x1="4" y1="16" x2="20" y2="16" />
                        </svg>
                    </button>
                )}

                <ForumSidebar
                    isOpen={isSidebarOpen}
                    onToggle={handleToggleSidebar}
                    onOpenCreate={() => feedRef.current?.openCreate()}
                    onNotify={showNotice}
                />

                {/* Cột chính giữa toàn màn hình: Feed bài viết */}
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-4xl space-y-4">
                        <ForumNotice notice={pageNotice} onDismiss={dismissNotice} />

                        {/* Feed bài viết */}

                        {/* Feed bài viết */}
                        <section>
                            <ForumPostFeed
                                ref={feedRef}
                                filters={{
                                    page,
                                    limit: 10,
                                    keyword,
                                    eventId,
                                    mine,
                                    liked,
                                    sortBy,
                                }}
                                onPageChange={(nextPage) =>
                                    updateFilters(
                                        { page: nextPage > 1 ? nextPage : "" },
                                        { resetPage: false }
                                    )
                                }
                                onResetToFirstPage={() => updateFilters({}, { resetPage: true })}
                                preloadedEvents={taggableEvents}
                                hasActiveFilters={hasActiveFilters}
                                onResetFilters={handleClearFilters}
                                emptyTitle={
                                    liked
                                        ? "Chưa có bài viết đã thích"
                                        : mine
                                            ? "Bạn chưa đăng bài viết nào"
                                            : "Chưa tìm thấy bài viết nào"
                                }
                                emptyDescription={
                                    liked
                                        ? "Thả tim những bài viết bạn yêu thích để dễ dàng xem lại tại đây!"
                                        : mine
                                            ? "Hãy chia sẻ cảm nghĩ hoặc đặt câu hỏi đầu tiên cùng cộng đồng nhé."
                                            : hasActiveFilters
                                                ? "Thử thay đổi từ khóa hoặc bộ lọc chủ đề để xem thêm bài viết."
                                                : "Hãy mở đầu cuộc trò chuyện bằng bài viết đầu tiên của bạn!"
                                }
                            />
                        </section>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default ForumListPage;

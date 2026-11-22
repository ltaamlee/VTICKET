import { useCallback, useId, useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Filter,
    Search,
    X,
} from "lucide-react";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import Button from "../../../components/common/button/Button";
import { useAuth } from "../../../contexts/AuthContext";
import ForumPostFeed from "../components/ForumPostFeed";
import ForumSidebar from "../components/ForumSidebar";
import ForumNotice from "../components/ForumNotice";
import { useTaggableEvents } from "../hooks/useTaggableEvents";
import { SORT_OPTIONS, formatShortEventDate } from "../utils/forumHelpers";

function ForumListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const feedRef = useRef(null);
    const searchInputRef = useRef(null);

    const searchInputId = useId();
    const topicSelectId = useId();
    const sortSelectId = useId();

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const keyword = searchParams.get("keyword") || "";
    const eventId = searchParams.get("eventId") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const mine = isAuthenticated && searchParams.get("mine") === "true";
    const liked = isAuthenticated && searchParams.get("liked") === "true";
    const tab = searchParams.get("tab") || "";

    const [searchInput, setSearchInput] = useState(keyword);
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

    // Tự động focus vào ô tìm kiếm nếu tab=search
    useEffect(() => {
        if (tab === "search" && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [tab]);

    const [prevKeyword, setPrevKeyword] = useState(keyword);
    if (prevKeyword !== keyword) {
        setPrevKeyword(keyword);
        setSearchInput(keyword);
    }

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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateFilters({ keyword: searchInput.trim(), tab: "" });
    };

    const handleClearFilters = () => {
        setSearchInput("");
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

                {/* Cột chính giữa toàn màn hình: Khung tìm kiếm & Feed bài viết */}
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-2xl space-y-4">
                        <ForumNotice notice={pageNotice} onDismiss={dismissNotice} />

                        {/* Khung tìm kiếm & Bộ lọc */}
                        <search aria-label="Tìm kiếm và lọc bài viết">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:p-4"
                            >
                                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
                                    <div className="md:col-span-5">
                                        <label
                                            htmlFor={searchInputId}
                                            className="mb-1 block text-xs font-medium text-slate-600"
                                        >
                                            Từ khóa tìm kiếm
                                        </label>
                                        <div className="relative flex items-center">
                                            <Search
                                                className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
                                                aria-hidden="true"
                                            />
                                            <input
                                                ref={searchInputRef}
                                                id={searchInputId}
                                                type="search"
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && e.nativeEvent.isComposing) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                autoCorrect="off"
                                                autoCapitalize="none"
                                                placeholder="Tiêu đề, nội dung bài viết..."
                                                className="w-full rounded-xl border border-slate-300 py-2 pr-9 pl-9 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                            {searchInput && (
                                                <button
                                                    type="button"
                                                    aria-label="Xóa từ khóa"
                                                    onClick={() => {
                                                        setSearchInput("");
                                                        if (keyword) {
                                                            updateFilters({ keyword: "" });
                                                        }
                                                    }}
                                                    className="absolute right-2.5 cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-700"
                                                >
                                                    <X className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-4">
                                        <label
                                            htmlFor={topicSelectId}
                                            className="mb-1 block text-xs font-medium text-slate-600"
                                        >
                                            Chủ đề / Sự kiện
                                        </label>
                                        <select
                                            id={topicSelectId}
                                            value={eventId}
                                            onChange={(e) => updateFilters({ eventId: e.target.value })}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">Tất cả chủ đề</option>
                                            <option value="general">Thảo luận chung</option>
                                            {taggableEvents.length > 0 && (
                                                <optgroup label="Theo sự kiện">
                                                    {taggableEvents.map((ev) => (
                                                        <option key={ev.id} value={ev.id}>
                                                            {ev.name}
                                                            {ev.startAt
                                                                ? ` (${formatShortEventDate(ev.startAt)})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>

                                    <div className="md:col-span-3">
                                        <label
                                            htmlFor={sortSelectId}
                                            className="mb-1 block text-xs font-medium text-slate-600"
                                        >
                                            Sắp xếp
                                        </label>
                                        <select
                                            id={sortSelectId}
                                            value={sortBy}
                                            onChange={(e) => updateFilters({ sortBy: e.target.value })}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            {SORT_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                                        <span>Lọc bài viết theo sở thích</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {hasActiveFilters && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleClearFilters}
                                            >
                                                Đặt lại
                                            </Button>
                                        )}
                                        <Button type="submit" size="sm">
                                            Tìm kiếm
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </search>

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

import { useCallback, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Filter,
    MessageSquarePlus,
    Search,
    UserCheck,
    X,
} from "lucide-react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Button from "../../../components/common/button/Button";
import { useAuth } from "../../../contexts/AuthContext";
import ForumPostFeed from "../components/ForumPostFeed";
import { useTaggableEvents } from "../hooks/useTaggableEvents";
import { SORT_OPTIONS, formatShortEventDate } from "../utils/forumHelpers";

function ForumListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const feedRef = useRef(null);

    const searchInputId = useId();
    const topicSelectId = useId();
    const sortSelectId = useId();

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const keyword = searchParams.get("keyword") || "";
    const eventId = searchParams.get("eventId") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const mine = isAuthenticated && searchParams.get("mine") === "true";

    const [searchInput, setSearchInput] = useState(keyword);
    const [totalPosts, setTotalPosts] = useState(0);

    const { events: taggableEvents } = useTaggableEvents({ limit: 50 });

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
        updateFilters({ keyword: searchInput.trim() });
    };

    const handleClearFilters = () => {
        setSearchInput("");
        setSearchParams(new URLSearchParams());
    };

    const hasActiveFilters = Boolean(keyword || eventId || mine || sortBy !== "newest");

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Diễn đàn
                    </h1>

                    <Button
                        type="button"
                        onClick={() => feedRef.current?.openCreate()}
                        icon={MessageSquarePlus}
                    >
                        Đăng bài viết
                    </Button>
                </div>

                <search aria-label="Tìm kiếm và lọc bài viết">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"
                    >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                            <div className="md:col-span-5">
                                <label
                                    htmlFor={searchInputId}
                                    className="mb-1 block text-xs font-medium text-slate-600"
                                >
                                    Tìm kiếm bài viết
                                </label>
                                <div className="relative flex items-center">
                                    <Search
                                        className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <input
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
                                        placeholder="Từ khóa tiêu đề, nội dung..."
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

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {isAuthenticated && (
                                    <button
                                        type="button"
                                        aria-pressed={mine}
                                        onClick={() => updateFilters({ mine: !mine })}
                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                            mine
                                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                        Bài viết của tôi
                                    </button>
                                )}

                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                    <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                                    {totalPosts} bài viết
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleClearFilters}
                                    >
                                        Đặt lại bộ lọc
                                    </Button>
                                )}
                                <Button type="submit" size="sm">
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>
                    </form>
                </search>

                <section className="mt-6">
                    <ForumPostFeed
                        ref={feedRef}
                        filters={{
                            page,
                            limit: 10,
                            keyword,
                            eventId,
                            mine,
                            sortBy,
                        }}
                        onPageChange={(nextPage) =>
                            updateFilters(
                                { page: nextPage > 1 ? nextPage : "" },
                                { resetPage: false }
                            )
                        }
                        onResetToFirstPage={() => updateFilters({}, { resetPage: true })}
                        onTotalChange={setTotalPosts}
                        preloadedEvents={taggableEvents}
                        hasActiveFilters={hasActiveFilters}
                        onResetFilters={handleClearFilters}
                        emptyDescription={
                            hasActiveFilters
                                ? "Thử thay đổi từ khóa hoặc bộ lọc chủ đề để xem thêm bài viết."
                                : "Hãy mở đầu cuộc trò chuyện bằng bài viết đầu tiên của bạn!"
                        }
                    />
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default ForumListPage;

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, MessageCircle, MessagesSquare, Search, User, X } from "lucide-react";
import Header from "../../../layout/Header";
import Footer from "../../../layout/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import { getProfile } from "../../profile/services/profileService";
import { getMyActivity } from "../services/forumService";
import ForumPostFeed from "../components/ForumPostFeed";
import ForumSidebar from "../components/ForumSidebar";
import ForumNotice from "../components/ForumNotice";
import ForumRightSearch from "../components/ForumRightSearch";
import { useTaggableEvents } from "../hooks/useTaggableEvents";

function ForumListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated, user, updateUser } = useAuth();
    const feedRef = useRef(null);
    const [profileAvatar, setProfileAvatar] = useState("");
    const [profileName, setProfileName] = useState("");

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const keyword = searchParams.get("keyword") || "";
    const eventId = searchParams.get("eventId") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const mine = isAuthenticated && searchParams.get("mine") === "true";
    const liked = isAuthenticated && searchParams.get("liked") === "true";
    const isActivityTab = isAuthenticated && searchParams.get("tab") === "activity";
    const isSearchTab = searchParams.get("tab") === "search";
    const [searchInput, setSearchInput] = useState(keyword);

    const [pageNotice, setPageNotice] = useState(null);
    const [activityItems, setActivityItems] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState("");

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

    useEffect(() => {
        if (!mine || !isAuthenticated) return;
        let cancelled = false;
        getProfile()
            .then((res) => {
                if (cancelled) return;
                const data = res?.data || res;
                if (data?.avatar) {
                    setProfileAvatar(data.avatar);
                    if (data.avatar !== user?.avatar) {
                        updateUser?.({ avatar: data.avatar });
                    }
                }
                if (data?.fullName) {
                    setProfileName(data.fullName);
                }
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [mine, isAuthenticated, user?.avatar, updateUser]);

    const resolvedAvatar = profileAvatar || user?.avatarUrl || user?.avatar || "";
    const resolvedName = profileName || user?.fullName || user?.name || "Thành viên";

    useEffect(() => {
        if (!isActivityTab) return;
        let cancelled = false;
        setActivityLoading(true);
        setActivityError("");
        getMyActivity({ limit: 30 })
            .then((res) => {
                if (cancelled) return;
                setActivityItems(res?.data?.items || []);
            })
            .catch((err) => {
                if (cancelled) return;
                setActivityError(err.message || "Không thể tải danh sách hoạt động.");
            })
            .finally(() => {
                if (!cancelled) setActivityLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isActivityTab]);

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
                    <div className="mx-auto w-full max-w-2xl space-y-4">
                        <ForumNotice notice={pageNotice} onDismiss={dismissNotice} />

                        {/* Khung Profile khi ở tab Bài của tôi */}
                        {mine && user && (
                            <section
                                aria-label="Thông tin trang cá nhân"
                                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                                            {resolvedName}
                                        </h1>
                                        <p className="mt-0.5 truncate text-sm text-slate-500">
                                            {user.username ? `@${user.username}` : user.email}
                                        </p>
                                    </div>

                                    {resolvedAvatar ? (
                                        <img
                                            src={resolvedAvatar}
                                            alt={resolvedName}
                                            className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-slate-200 sm:h-16 sm:w-16"
                                        />
                                    ) : (
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200 sm:h-16 sm:w-16">
                                            <User className="h-7 w-7" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => feedRef.current?.openCreate()}
                                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                                    >
                                        {resolvedAvatar ? (
                                            <img
                                                src={resolvedAvatar}
                                                alt=""
                                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                                <User className="h-4 w-4" aria-hidden="true" />
                                            </div>
                                        )}
                                        <span className="truncate text-sm text-slate-400">
                                            Có gì mới?
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => feedRef.current?.openCreate()}
                                        className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                                    >
                                        Đăng
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Hoạt động hoặc Feed bài viết */}
                        {isActivityTab ? (
                            <section
                                aria-label="Hoạt động trên bài viết của bạn"
                                className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs"
                            >
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h1 className="text-lg font-bold text-slate-900">
                                        Hoạt động
                                    </h1>
                                </div>

                                {activityLoading ? (
                                    <div className="divide-y divide-slate-100 p-5">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                                                <div className="h-10 w-10 rounded-full bg-slate-200" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3.5 w-1/3 rounded bg-slate-200" />
                                                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : activityError ? (
                                    <div className="p-8 text-center text-sm text-red-600">
                                        {activityError}
                                    </div>
                                ) : activityItems.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <MessagesSquare
                                            className="mx-auto h-10 w-10 text-slate-300"
                                            aria-hidden="true"
                                        />
                                        <h3 className="mt-3 text-base font-semibold text-slate-800">
                                            Chưa có hoạt động nào
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Khám phá thêm các bài đăng khác và tương tác cùng cộng đồng nhé.
                                        </p>
                                        <div className="mt-5 flex justify-center">
                                            <Link
                                                to="/forum"
                                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                            >
                                                Khám phá bài viết
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {activityItems.map((item) => (
                                            <Link
                                                key={item.id}
                                                to={`/forum/${item.post?.id}`}
                                                className="flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-slate-50"
                                            >
                                                <div className="relative shrink-0">
                                                    {item.actor?.avatar ? (
                                                        <img
                                                            src={item.actor.avatar}
                                                            alt={item.actor.name}
                                                            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                                                            <User className="h-5 w-5" aria-hidden="true" />
                                                        </div>
                                                    )}
                                                    <span
                                                        className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-white ${
                                                            item.activityType === "REACTION"
                                                                ? "bg-pink-500"
                                                                : "bg-blue-500"
                                                        }`}
                                                    >
                                                        {item.activityType === "REACTION" ? (
                                                            <Heart className="h-2.5 w-2.5 fill-current" />
                                                        ) : (
                                                            <MessageCircle className="h-2.5 w-2.5 fill-current" />
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="truncate font-semibold text-slate-900">
                                                            {item.actor?.name}
                                                        </span>
                                                        <span className="shrink-0 text-xs text-slate-400">
                                                            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-sm text-slate-600">
                                                        {item.activityType === "REACTION"
                                                            ? "Đã thích bài viết của bạn"
                                                            : `Đã bình luận: "${item.commentContent}"`}
                                                    </p>
                                                    {item.post?.content && (
                                                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                                                            {item.post.content}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : (
                        <section
                            aria-label="Danh sách bài viết"
                            className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs"
                        >
                            {isSearchTab && (
                                <div className="border-b border-slate-100 p-4">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchInput}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSearchInput(val);
                                                updateFilters({ keyword: val.trim(), tab: "search" });
                                            }}
                                            placeholder="Tìm kiếm tên người dùng, bài viết hoặc từ khóa..."
                                            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none focus:border-slate-300 focus:bg-white"
                                        />
                                        {searchInput && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchInput("");
                                                    updateFilters({ keyword: "", tab: "search" });
                                                }}
                                                aria-label="Xóa từ khóa"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm font-bold text-slate-900">
                                        {keyword ? `Kết quả cho "${keyword}"` : "Đang thịnh hành"}
                                    </p>
                                </div>
                            )}
                            {!mine && !liked && !isSearchTab && (
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h1 className="text-lg font-bold text-slate-900">
                                        Dành cho bạn
                                    </h1>
                                </div>
                            )}
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
                                        ? "Khám phá thêm các bài đăng khác và thả tim những bài viết bạn yêu thích nhé."
                                        : mine
                                            ? "Hãy chia sẻ cảm nghĩ hoặc đặt câu hỏi đầu tiên cùng cộng đồng nhé."
                                            : hasActiveFilters
                                                ? "Thử thay đổi từ khóa hoặc bộ lọc chủ đề để xem thêm bài viết."
                                                : "Hãy mở đầu cuộc trò chuyện bằng bài viết đầu tiên của bạn!"
                                }
                                emptyAction={
                                    liked ? (
                                        <Link
                                            to="/forum"
                                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                        >
                                            Khám phá bài viết
                                        </Link>
                                    ) : null
                                }
                            />
                        </section>
                        )}
                    </div>
                </main>

                {isSearchTab ? (
                    <aside className="hidden xl:block w-80 shrink-0 pr-6 py-6">
                        <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                            <h2 className="text-sm font-bold text-slate-900">
                                Chủ đề dành cho bạn
                            </h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {taggableEvents.slice(0, 12).map((ev) => (
                                    <button
                                        key={ev.id}
                                        type="button"
                                        onClick={() =>
                                            updateFilters({
                                                eventId: eventId === ev.id ? "" : ev.id,
                                                tab: "search",
                                            })
                                        }
                                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                            eventId === ev.id
                                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        {ev.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                ) : (
                    <ForumRightSearch />
                )}
            </div>

            <Footer />
        </div>
    );
}

export default ForumListPage;

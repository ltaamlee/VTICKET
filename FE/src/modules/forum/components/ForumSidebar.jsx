import { Link, useLocation } from "react-router-dom";
import {
    Home,
    Search,
    Bell,
    Heart,
    Plus,
    User,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

function ForumSidebar({
    isOpen = true,
    onToggle,
    onOpenCreate,
    onNotify,
}) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const { isAuthenticated } = useAuth();
    const redirectToLogin = useAuthRedirect();

    const liked = searchParams.get("liked") === "true";
    const mine = searchParams.get("mine") === "true";
    const tab = searchParams.get("tab") || "";
    const keyword = searchParams.get("keyword") || "";

    const isForYouActive = !liked && !mine && !tab && !keyword;
    const isSearchActive = tab === "search" || Boolean(keyword);
    const isActivityActive = tab === "activity";
    const isLikedActive = liked;
    const isMineActive = mine;

    const handleProtectedClick = (e, callback) => {
        if (!isAuthenticated) {
            e.preventDefault();
            redirectToLogin("Vui lòng đăng nhập để sử dụng tính năng này");
            return;
        }
        callback?.();
    };

    const handleOpenCreatePost = () => {
        if (!isAuthenticated) {
            redirectToLogin("Vui lòng đăng nhập để đăng bài viết");
            return;
        }
        onOpenCreate?.();
    };

    const navItems = [
        {
            id: "for-you",
            label: "Dành cho bạn",
            icon: Home,
            to: "/forum",
            isActive: isForYouActive,
        },
        {
            id: "search",
            label: "Tìm kiếm",
            icon: Search,
            to: "/forum?tab=search",
            isActive: isSearchActive,
        },
        {
            id: "activity",
            label: "Hoạt động",
            icon: Bell,
            to: "/forum?tab=activity",
            isActive: isActivityActive,
            requireAuth: true,
        },
        {
            id: "liked",
            label: "Đã thích",
            icon: Heart,
            to: "/forum?liked=true",
            isActive: isLikedActive,
            requireAuth: true,
        },
        ...(isAuthenticated
            ? [
                {
                    id: "mine",
                    label: "Trang cá nhân",
                    icon: User,
                    to: "/forum?mine=true",
                    isActive: isMineActive,
                },
            ]
            : []),
    ];

    return (
        <>
            {/* Desktop Sidebar sát mép trái toàn màn hình */}
            <aside
                className={`sticky top-16 hidden md:flex h-[calc(100vh-4rem)] shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white/95 px-3 py-4 backdrop-blur-md transition-all duration-300 z-20 ${isOpen ? "w-60" : "w-0 p-0 overflow-hidden border-none"
                    }`}
            >
                {isOpen && (
                    <div className="flex h-full flex-col justify-between">
                        <div className="space-y-6">
                            {/* Header Sidebar: Nút Toggle 2 gạch ngang */}
                            <div className="flex items-center justify-end px-3">
                                <button
                                    type="button"
                                    onClick={onToggle}
                                    title="Thu gọn thanh điều hướng"
                                    aria-label="Thu gọn thanh điều hướng"
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
                            </div>

                            {/* Danh sách Menu điều hướng */}
                            <nav className="space-y-1" aria-label="Menu điều hướng diễn đàn">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const activeClass = item.isActive
                                        ? "bg-slate-100 font-bold text-slate-900"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium";

                                    return (
                                        <Link
                                            key={item.id}
                                            to={item.to}
                                            onClick={(e) => {
                                                if (item.onClick) {
                                                    item.onClick(e);
                                                } else if (item.requireAuth) {
                                                    handleProtectedClick(e);
                                                }
                                            }}
                                            className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm transition-colors ${activeClass}`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 shrink-0 ${item.isActive
                                                    ? "text-slate-900"
                                                    : "text-slate-500"
                                                    }`}
                                            />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Nút + Bài đăng mới (Nút Pill màu đen bo tròn dưới cùng như Threads) */}
                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleOpenCreatePost}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black active:scale-[0.98]"
                            >
                                <Plus className="h-4.5 w-4.5" />
                                <span>Bài đăng mới</span>
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Bottom Navigation Bar (hiển thị trên thiết bị di động) */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md shadow-lg"
                aria-label="Thanh điều hướng di động"
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.id}
                            to={item.to}
                            onClick={(e) => {
                                if (item.onClick) {
                                    item.onClick(e);
                                } else if (item.requireAuth) {
                                    handleProtectedClick(e);
                                }
                            }}
                            className={`flex flex-col items-center gap-1 p-2 text-xs transition-colors ${item.isActive ? "font-bold text-slate-900" : "text-slate-500"
                                }`}
                        >
                            <Icon
                                className={`h-5 w-5 ${item.isActive && item.id === "liked"
                                    ? "fill-red-500 text-red-500"
                                    : item.isActive
                                        ? "text-slate-900"
                                        : "text-slate-500"
                                    }`}
                            />
                            <span className="text-[11px]">{item.label}</span>
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={handleOpenCreatePost}
                    aria-label="Đăng bài mới"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-md active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </nav>
        </>
    );
}

export default ForumSidebar;

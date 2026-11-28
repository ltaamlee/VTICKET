
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    LayoutDashboard,
    Calendar,
    LogOut,
    ChevronDown,
    Shield,
    Ticket,
    Building2,
    Search,
    Repeat2,
    Wallet,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useSystemSettings } from "../contexts/SystemSettingsContext";
import NotificationBell from "../modules/notification/components/NotificationBell";

// ==========================================
// CONSTANTS
// ==========================================

const NAV_ITEMS = [
    { label: "Trang chủ", path: "/" },
    { label: "Sự kiện", path: "/events" },
    { label: "Diễn đàn", path: "/forum" },
    { label: "Resale", path: "/resales" },
];

const MENU_ITEMS = {
    ADMIN: [
        {
            label: "Trang quản trị",
            path: "/admin/dashboard",
            icon: LayoutDashboard,
            color: "text-purple-500",
        },
    ],

    ORGANIZER: [
        {
            label: "Hồ sơ cá nhân",
            path: "/profile",
            icon: User,
            color: "text-blue-500",
        },
        {
            label: "Vé của tôi",
            path: "/my-tickets",
            icon: Ticket,
            color: "text-emerald-500",
        },
        {
            label: "Quản lý sự kiện",
            path: "/organizer/events",
            icon: LayoutDashboard,
            color: "text-purple-500",
        },
    ],

    USER: [
        {
            label: "Hồ sơ cá nhân",
            path: "/profile",
            icon: User,
            color: "text-blue-500",
        },
        {
            label: "Vé của tôi",
            path: "/my-tickets",
            icon: Ticket,
            color: "text-emerald-500",
        },
        {
            label: "Ví điện tử",
            path: "/wallet",
            icon: Wallet,
            color: "text-indigo-500",
        },
    ],
};

// ==========================================
// SUB COMPONENTS
// ==========================================

function SearchForm({ mobile = false, value, onChange, onSubmit }) {
    return (
        <form
            onSubmit={onSubmit}
            role="search"
            className={`relative ${
                mobile
                    ? "w-full"
                    : "hidden max-w-xs flex-1 sm:block md:max-w-sm lg:max-w-md"
            }`}
        >
            <Search
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 ${
                    mobile ? "h-3.5 w-3.5" : "h-4 w-4"
                }`}
            />

            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={
                    mobile
                        ? "Tìm kiếm sự kiện..."
                        : "Tìm kiếm sự kiện, nghệ sĩ, địa điểm..."
                }
                aria-label="Tìm kiếm sự kiện"
                autoComplete="off"
                className={`w-full rounded-full border border-blue-200 bg-white text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 ${
                    mobile
                        ? "py-1.5 pl-9 pr-3 text-xs"
                        : "py-2 pl-10 pr-4 text-xs shadow-sm sm:text-sm"
                }`}
            />
        </form>
    );
}

function UserAvatar({ user, size = "h-9 w-9" }) {
    const initial = (user?.fullName || user?.email || "U")
        .charAt(0)
        .toUpperCase();

    return user?.avatar ? (
        <img
            src={user.avatar}
            alt="Avatar"
            className={`${size} shrink-0 rounded-full object-cover ring-2 ring-blue-500/20`}
        />
    ) : (
        <div
            className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-sm`}
        >
            {initial}
        </div>
    );
}

function MenuItem({ item, onClick }) {
    const Icon = item.icon;

    return (
        <Link
            to={item.path}
            onClick={onClick}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-blue-600"
        >
            <Icon className={`h-4 w-4 ${item.color}`} />
            <span>{item.label}</span>
        </Link>
    );
}

// ==========================================
// HEADER
// ==========================================

function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { settings } = useSystemSettings();

    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [showMenu, setShowMenu] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    const role = user?.role;

    // --------------------------------------
    // DROPDOWN
    // --------------------------------------

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setShowMenu(false);
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const closeMenu = () => setShowMenu(false);

    // --------------------------------------
    // SEARCH
    // --------------------------------------

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        const keyword = searchKeyword.trim();

        const query = keyword
            ? `?keyword=${encodeURIComponent(keyword)}`
            : "";

        navigate(`/events${query}`);
    };

    // --------------------------------------
    // AUTHENTICATION
    // --------------------------------------

    const handleLogout = () => {
        closeMenu();
        logout();
        navigate("/", { replace: true });
    };

    // --------------------------------------
    // USER MENU
    // --------------------------------------

    const menuItems = MENU_ITEMS[role] || [];

    const showOrganizerRegister = role === "USER";

    // --------------------------------------
    // RENDER
    // --------------------------------------

    return (
        <header className="sticky top-0 z-40 bg-blue-100/90 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-6 sm:px-6">

                {/* LOGO */}
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2 text-2xl font-black tracking-tight text-blue-600 transition hover:opacity-90"
                    style={{
                        color: settings?.primaryColor || undefined,
                    }}
                >
                    {settings?.logoUrl && (
                        <img
                            src={settings.logoUrl}
                            alt={settings.title || "Logo"}
                            className="h-8 w-auto max-w-[140px] object-contain"
                        />
                    )}

                    <span>{settings?.title || "VTICKET"}</span>
                </Link>

                {/* DESKTOP SEARCH */}
                <SearchForm
                    value={searchKeyword}
                    onChange={setSearchKeyword}
                    onSubmit={handleSearchSubmit}
                />

                {/* NAVIGATION */}
                <nav className="hidden shrink-0 items-center gap-6 lg:flex">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="text-sm font-medium text-gray-700 transition hover:text-blue-600"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* AUTHENTICATION */}
                <div className="flex shrink-0 items-center gap-3">
                    {!isAuthenticated ? (
                        <>
                            <Link
                                to="/login"
                                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-blue-200/60 sm:text-sm"
                            >
                                Đăng nhập
                            </Link>

                            <Link
                                to="/register"
                                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:text-sm"
                            >
                                Đăng ký
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* NOTIFICATION */}
                            <NotificationBell />

                            {/* USER DROPDOWN */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowMenu((prev) => !prev)
                                    }
                                    aria-expanded={showMenu}
                                    aria-haspopup="menu"
                                    aria-label="Menu tài khoản"
                                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:border-blue-300 hover:bg-blue-200/60"
                                >
                                    <UserAvatar user={user} />

                                    <span className="hidden max-w-32 truncate text-left text-sm font-semibold text-gray-800 sm:block">
                                        {user?.fullName || "Người dùng"}
                                    </span>

                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                                            showMenu ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {showMenu && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
                                    >
                                        {/* USER INFORMATION */}
                                        <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
                                            <UserAvatar
                                                user={user}
                                                size="h-10 w-10"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-gray-900">
                                                    {user?.fullName ||
                                                        "Người dùng"}
                                                </p>

                                                <p className="truncate text-xs text-gray-500">
                                                    {user?.email}
                                                </p>

                                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                                    <Shield className="h-2.5 w-2.5" />
                                                    {role || "USER"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* MENU ITEMS */}
                                        <div className="space-y-1">
                                            {menuItems.map((item) => (
                                                <MenuItem
                                                    key={item.path}
                                                    item={item}
                                                    onClick={closeMenu}
                                                />
                                            ))}

                                            {/* REGISTER ORGANIZER */}
                                            {showOrganizerRegister && (
                                                <Link
                                                    to="/organizer/register"
                                                    onClick={closeMenu}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                                                >
                                                    <Building2 className="h-4 w-4" />
                                                    <span>
                                                        Đăng ký làm BTC
                                                    </span>
                                                </Link>
                                            )}
                                        </div>

                                        {/* LOGOUT */}
                                        <div className="my-2 border-t border-gray-100" />

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MOBILE SEARCH */}
            <div className="px-4 pb-2.5 sm:hidden">
                <SearchForm
                    mobile
                    value={searchKeyword}
                    onChange={setSearchKeyword}
                    onSubmit={handleSearchSubmit}
                />
            </div>
        </header>
    );
}

export default Header;

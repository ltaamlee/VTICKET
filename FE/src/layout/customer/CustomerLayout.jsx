import { Outlet, useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CustomerSidebar from "./CustomerSidebar";
import { Home, LogOut, ChevronDown } from "lucide-react";

function CustomerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const userMenuRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        navigate("/login", { replace: true });
    };

    const displayName =
        user?.fullName || user?.username || user?.name || user?.email || "Khách hàng";

    const avatarText = displayName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-gray-100">
            <CustomerSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                onLogout={handleLogout}
            />

            <div className="min-h-screen sm:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
                            aria-label="Mở menu"
                        >
                            ☰
                        </button>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Tài khoản của tôi
                            </h2>

                            <p className="hidden text-sm text-gray-500 sm:block">
                                Quản lý vé, đơn hàng và ví điện tử VTICKET
                            </p>
                        </div>
                    </div>

                    {/* Thông tin người dùng đăng nhập */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowUserMenu((prev) => !prev)}
                            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-gray-100"
                        >
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold text-gray-800">
                                    {displayName}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {user?.email}
                                </p>
                            </div>

                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Avatar"
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm">
                                    {avatarText}
                                </div>
                            )}

                            <ChevronDown
                                className={`h-4 w-4 text-gray-500 transition-transform ${
                                    showUserMenu ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <div className="absolute right-0 z-50 mt-2 w-56 animate-in fade-in zoom-in-95 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 duration-150">
                                <div className="border-b border-gray-100 px-3 py-2">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {displayName}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {user?.email}
                                    </p>
                                </div>

                                <div className="mt-1 space-y-1">
                                    <Link
                                        to="/"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                                    >
                                        <Home className="h-4 w-4 text-blue-500" />
                                        <span>Về trang chủ</span>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4 text-red-500" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Nội dung trang con */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default CustomerLayout;

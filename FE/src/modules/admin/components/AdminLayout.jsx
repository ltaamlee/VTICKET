import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import AdminSidebar from "./AdminSidebar";

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const displayName =
        user?.fullName ||
        user?.username ||
        user?.name ||
        user?.email ||
        "Admin";

    const avatarText = displayName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                onLogout={handleLogout}
            />

            {/* Nội dung chính */}
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
                                Trang quản trị
                            </h2>

                            <p className="hidden text-sm text-gray-500 sm:block">
                                Quản lý hệ thống VTicket
                            </p>
                        </div>
                    </div>

                    {/* Thông tin người dùng đăng nhập */}
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-gray-800">
                                {displayName}
                            </p>

                            <p className="text-xs text-gray-500">
                                {user?.role || "Quản trị viên"}
                            </p>
                        </div>

                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Avatar"
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                                {avatarText}
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

export default AdminLayout;
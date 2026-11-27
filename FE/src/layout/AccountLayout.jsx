import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Camera, LogOut, Repeat2, Ticket, UserRound, Wallet } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import { getProfile, uploadAvatar } from "../modules/profile/services/profileService";
import AvatarUploadModal from "../modules/profile/components/AvatarUploadModal";

export default function AccountLayout({ children, embedded = false }) {
    const { user, updateUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Đảm bảo dữ liệu người dùng luôn mới nhất
    useEffect(() => {
        let isMounted = true;
        getProfile()
            .then((res) => {
                if (isMounted && res?.data) {
                    updateUser(res.data);
                }
            })
            .catch((err) => {
                console.warn("Could not sync user profile header:", err);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Modal upload avatar lên Cloudinary
    const fileInputRef = useRef(null);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState("");
    const [avatarSuccess, setAvatarSuccess] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const displayName =
        user?.fullName ||
        user?.username ||
        user?.name ||
        user?.email ||
        "Khách hàng";
    const avatarText = displayName.charAt(0).toUpperCase();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // Menu khu vực tài khoản (đã bỏ "Đơn hàng của tôi" theo yêu cầu)
    const navItems = [
        {
            id: "tickets",
            label: "Vé của tôi",
            path: "/my-tickets",
            icon: Ticket,
        },
        {
            id: "resales",
            label: "Bán vé của tôi",
            path: "/my-resales",
            icon: Repeat2,
        },
        {
            id: "wallet",
            label: "Ví điện tử",
            path: "/wallet",
            icon: Wallet,
        },
        {
            id: "info",
            label: "Thông tin tài khoản",
            path: "/profile",
            icon: UserRound,
        },
    ];

    // Xác định mục đang active
    const getActiveItem = () => {
        if (location.pathname === "/my-tickets") return "tickets";
        if (location.pathname === "/my-resales") return "resales";
        if (location.pathname === "/wallet") return "wallet";
        if (location.pathname.endsWith("/profile")) return "info";
        return "";
    };

    const activeItem = getActiveItem();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError("");
        setAvatarSuccess("");

        if (!file.type.startsWith("image/")) {
            setAvatarError(
                "Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)"
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setAvatarError(
                "Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn"
            );
            return;
        }

        setSelectedFile(file);
        setFilePreview(URL.createObjectURL(file));
    };

    const handleCancelFileSelect = () => {
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
        }
        setSelectedFile(null);
        setFilePreview(null);
        setAvatarError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile) {
            setAvatarError("Vui lòng chọn tệp hình ảnh trước khi tải lên");
            return;
        }

        setUploadingAvatar(true);
        setAvatarError("");
        setAvatarSuccess("");

        try {
            const response = await uploadAvatar(selectedFile);
            const updatedUser = response.data;

            updateUser({ avatar: updatedUser.avatar });
            setAvatarSuccess("Tải ảnh đại diện lên Cloudinary thành công!");
            handleCancelFileSelect();

            setTimeout(() => {
                setShowAvatarModal(false);
                setAvatarSuccess("");
            }, 1500);
        } catch (err) {
            setAvatarError(
                err.message || "Tải ảnh đại diện thất bại. Vui lòng thử lại"
            );
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        setAvatarError("");
        setAvatarSuccess("");

        if (!file.type.startsWith("image/")) {
            setAvatarError(
                "Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)"
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setAvatarError(
                "Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn"
            );
            return;
        }

        setSelectedFile(file);
        setFilePreview(URL.createObjectURL(file));
    };

    const handleCloseAvatarModal = () => {
        if (uploadingAvatar) return;
        setShowAvatarModal(false);
        handleCancelFileSelect();
        setAvatarError("");
        setAvatarSuccess("");
    };

    // Cột điều hướng tài khoản (dùng chung desktop + mobile)
    const renderAccountNav = () => (
        <div className="flex h-full flex-col">
            {/* Avatar + tên + email */}
            <div className="flex items-center gap-3 px-5 py-6">
                <div className="relative shrink-0">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Avatar"
                            className="h-14 w-14 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                            {avatarText}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowAvatarModal(true)}
                        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-1.5 text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:text-blue-600"
                        title="Đổi ảnh đại diện"
                    >
                        <Camera className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                        {displayName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                        {user?.email}
                    </p>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto border-t border-gray-100 px-3 py-4">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Tài khoản của tôi
                </p>

                <ul className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = activeItem === item.id;
                        const Icon = item.icon;

                        return (
                            <li key={item.id}>
                                <Link
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${
                                            isActive
                                                ? "text-blue-600"
                                                : "text-gray-400"
                                        }`}
                                    />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Đăng xuất */}
            <div className="border-t border-gray-100 px-3 py-3">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );

    // Khi nhúng vào trang quản trị (profile của admin/organizer)
    if (embedded) {
        return (
            <div
                className={`role-profile-content role-profile-${user?.role?.toLowerCase()} space-y-6`}
            >
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header website (giữ nguyên như các trang công khai) */}
            <Header />

            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Cột điều hướng tài khoản - desktop */}
                <aside className="hidden w-60 shrink-0 lg:block">
                    <div className="sticky top-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {renderAccountNav()}
                    </div>
                </aside>

                {/* Cột nội dung */}
                <main className="min-w-0 flex-1">
                    {children === undefined ? <Outlet /> : children}
                </main>
            </div>

            {/* Cột điều hướng tài khoản - mobile */}
            <div className="lg:hidden">
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Mở menu tài khoản"
                    aria-expanded={sidebarOpen}
                    className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700"
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" d="M5 7h14M5 12h14M5 17h10" />
                    </svg>
                    Tài khoản
                </button>

                <aside
                    aria-label="Menu tài khoản khách hàng"
                    className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-gray-200 bg-white transition-transform duration-300 ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {renderAccountNav()}
                </aside>
            </div>

            <Footer />

            {/* Modal upload avatar */}
            <AvatarUploadModal
                show={showAvatarModal}
                onClose={handleCloseAvatarModal}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                filePreview={filePreview}
                selectedFile={selectedFile}
                uploadingAvatar={uploadingAvatar}
                avatarError={avatarError}
                avatarSuccess={avatarSuccess}
                isDragging={isDragging}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleUploadAvatar={handleUploadAvatar}
            />
        </div>
    );
}

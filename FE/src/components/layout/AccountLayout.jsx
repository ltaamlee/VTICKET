import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../../contexts/AuthContext";
import { getProfile, uploadAvatar } from "../../modules/profile/services/profileService";
import AvatarUploadModal from "../../modules/profile/components/AvatarUploadModal";
import {
  User,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Lock,
  Ticket,
  Gem,
  Calendar,
} from "lucide-react";

export default function AccountLayout({ children }) {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTabParam = searchParams.get("tab");

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
        // Bỏ qua lỗi nhẹ nếu mạng lag
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

  // Xác định tab đang active
  const getActiveTab = () => {
    if (location.pathname === "/my-tickets") return "tickets";
    if (location.pathname === "/membership") return "membership";
    if (location.pathname === "/my-events") return "events";
    if (location.pathname === "/profile") {
      return currentTabParam === "security" ? "security" : "info";
    }
    return "info";
  };

  const activeTab = getActiveTab();

  // Danh sách các tab nằm ngang
  const allNavTabs = [
    {
      id: "info",
      label: "Thông tin cá nhân",
      path: "/profile",
      icon: User,
    },
    {
      id: "security",
      label: "Tài khoản & Bảo mật",
      path: "/profile?tab=security",
      icon: Lock,
    },
    {
      id: "tickets",
      label: "Vé đã mua",
      path: "/my-tickets",
      icon: Ticket,
      hideForAdmin: true,
    },
    {
      id: "membership",
      label: "Thẻ thành viên",
      path: "/membership",
      icon: Gem,
      hideForAdmin: true,
    },
    {
      id: "events",
      label: "Sự kiện của tôi",
      path: "/my-events",
      icon: Calendar,
      hideForAdmin: true,
    },
  ];

  const navTabs = allNavTabs.filter((tab) => {
    if (user?.role === "ADMIN" && tab.hideForAdmin) {
      return false;
    }
    return true;
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    setAvatarSuccess("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
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
      const newAvatarUrl = updatedUser.avatar;

      // Đồng bộ AuthContext
      updateUser({
        avatar: newAvatarUrl,
      });

      setAvatarSuccess("Tải ảnh đại diện lên Cloudinary thành công!");
      handleCancelFileSelect();

      setTimeout(() => {
        setShowAvatarModal(false);
        setAvatarSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Upload avatar error:", err);
      setAvatarError(err.message || "Tải ảnh đại diện thất bại. Vui lòng thử lại");
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
      setAvatarError("Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleCloseAvatarModal = () => {
    if (uploadingAvatar) return;
    setShowAvatarModal(false);
    handleCancelFileSelect();
    setAvatarError("");
    setAvatarSuccess("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Card thông tin người dùng đầu trang */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                {/* Avatar lớn với nút đổi ảnh */}
                <div className="relative group">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full ring-2 ring-gray-100 shadow-md bg-gray-100">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl font-extrabold text-white">
                        {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute bottom-1 right-1 rounded-full bg-blue-600 p-2 text-white shadow-md hover:bg-blue-700 transition"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {/* Tên & Tag vai trò */}
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user?.fullName || "Người dùng VTicket"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {user?.role || "USER"}
                    </span>
                    {user?.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã xác thực
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {user?.email}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    Thành viên từ:{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "Gần đây"}
                  </p>
                </div>
              </div>
            </div>

            {/* Thanh điều hướng Tabs nằm ngang đồng bộ */}
            <div className="mt-8 flex border-b border-gray-200 overflow-x-auto no-scrollbar">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Khu vực hiển thị nội dung từng trang riêng */}
          <div className="mt-6">
            {children}
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal Upload Avatar dùng chung cho toàn bộ Account */}
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

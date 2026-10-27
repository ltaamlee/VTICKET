import { useState, useEffect, useRef } from "react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../services/profileService";
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Ticket,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";



function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'security' | 'activity'
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [avatar, setAvatar] = useState("");

  // Modal upload avatar lên Cloudinary
  const fileInputRef = useRef(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdError("");
    setPwdSuccess("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword) {
      setPwdError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!newPassword) {
      setPwdError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError("Mật khẩu mới phải có tối thiểu 8 ký tự");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPwdError("Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa (A-Z)");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPwdError("Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9)");
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setPwdError("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)");
      return;
    }

    if (currentPassword === newPassword) {
      setPwdError("Mật khẩu mới không được trùng với mật khẩu hiện tại");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Mật khẩu xác nhận không khớp");
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPwdSuccess("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess("");
      }, 2000);
    } catch (err) {
      setPwdError(err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại");
    } finally {
      setPwdLoading(false);
    }
  };

  // Tải dữ liệu hồ sơ từ API
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getProfile();
      const data = response.data;
      setProfile(data);

      setFullName(data.fullName || "");
      setPhone(data.phone || "");
      setDob(data.dob ? data.dob.split("T")[0] : "");
      setAvatar(data.avatar || "");

      // Đồng bộ avatar vào AuthContext nếu chưa đồng bộ
      if (data.avatar && data.avatar !== authUser?.avatar) {
        updateUser({ avatar: data.avatar });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err.message || "Không thể tải thông tin hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    if (!profile) return;
    setFullName(profile.fullName || "");
    setPhone(profile.phone || "");
    setDob(profile.dob ? profile.dob.split("T")[0] : "");
    setAvatar(profile.avatar || "");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Họ và tên phải có tối thiểu 2 ký tự");
      return;
    }

    if (phone.trim()) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(phone.trim())) {
        setError("Số điện thoại không đúng định dạng (VD: 0987654321)");
        return;
      }
    }

    setSaving(true);
    try {
      const response = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        dob: dob || null,
        avatar: avatar.trim() || null,
      });

      const updated = response.data;
      setProfile(updated);
      setSuccess("Cập nhật thông tin cá nhân thành công!");

      // Đồng bộ vào AuthContext để cập nhật Header ngay lập tức
      updateUser({
        fullName: updated.fullName,
        avatar: updated.avatar,
        phone: updated.phone,
      });

      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Cập nhật thất bại. Vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

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

      // Cập nhật thông tin avatar trên trang
      setAvatar(newAvatarUrl);
      setProfile((prev) => (prev ? { ...prev, avatar: newAvatarUrl } : prev));

      // Đồng bộ AuthContext để Header cập nhật avatar ngay lập tức
      updateUser({
        avatar: newAvatarUrl,
      });

      setAvatarSuccess("Tải ảnh lên Cloudinary và cập nhật đại diện thành công!");
      handleCancelFileSelect();

      // Tự động đóng modal sau 1.5 giây
      setTimeout(() => {
        setShowAvatarModal(false);
        setAvatarSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Upload avatar error:", err);
      setAvatarError(err.message || "Tải ảnh đại diện lên Cloudinary thất bại. Vui lòng thử lại");
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
        {/* Nội dung hồ sơ */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Card thông tin đầu trang */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                {/* Avatar lớn */}
                <div className="relative group">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full ring-2 ring-gray-100 shadow-md bg-gray-100">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl font-extrabold text-white">
                        {(fullName || authUser?.email || "U").charAt(0).toUpperCase()}
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

                {/* Tên & Tag thông tin */}
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {fullName || profile?.fullName || "Người dùng VTicket"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {profile?.role || authUser?.role || "USER"}
                    </span>
                    {profile?.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã xác thực
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {profile?.email || authUser?.email}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    Thành viên từ:{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                      : "Gần đây"}
                  </p>
                </div>
              </div>

              {/* Nút hành động nhanh */}
              <div className="flex justify-center sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Đổi ảnh
                </button>
              </div>
            </div>

            {/* Thanh điều hướng Tabs */}
            <div className="mt-8 flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "info"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <User className="h-4 w-4" />
                Thông tin cá nhân
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "security"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Lock className="h-4 w-4" />
                Tài khoản & Bảo mật
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "activity"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Ticket className="h-4 w-4" />
                Vé của tôi
              </button>
            </div>
          </div>

          {/* Thông báo trạng thái */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === "info" && (
            <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Cập nhật thông tin hồ sơ
                </h3>
                <p className="text-sm text-gray-500">
                  Thông tin này sẽ được sử dụng khi bạn đặt vé và tham gia các sự kiện.
                </p>
              </div>

              {loading ? (
                <div className="py-12 text-center text-gray-500">
                  Đang tải thông tin hồ sơ...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Họ và tên */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nhập họ và tên đầy đủ"
                          required
                          className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Email (Readonly) */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Địa chỉ Email
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={profile?.email || ""}
                          disabled
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Email được dùng để đăng nhập và không thể thay đổi.
                      </p>
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ví dụ: 0912345678"
                          className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Ngày sinh
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nút submit */}
                  <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <RotateCcw className="h-4 w-4 text-gray-500" />
                      Khôi phục
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: TÀI KHOẢN & BẢO MẬT */}
          {activeTab === "security" && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Trạng thái bảo mật
                </h3>

                <div className="divide-y divide-gray-100">
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Xác thực Email</p>
                      <p className="text-sm text-gray-500">
                        Bảo vệ tài khoản và nhận vé điện tử gửi về hòm thư.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Đã kích hoạt
                    </span>
                  </div>

                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Trạng thái tài khoản</p>
                      <p className="text-sm text-gray-500">
                        {profile?.status === "ACTIVE"
                          ? "Tài khoản đang hoạt động bình thường."
                          : "Tài khoản đang bị hạn chế."}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      {profile?.status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-800">Đổi mật khẩu</p>
                      <p className="text-sm text-gray-500">
                        Cập nhật mật khẩu thường xuyên để tăng cường bảo vệ tài khoản của bạn.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenPasswordModal}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <KeyRound className="h-4 w-4" />
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VÉ CỦA TÔI */}
          {activeTab === "activity" && (
            <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Ticket className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                Vé điện tử của bạn
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Hiện tại bạn chưa có vé sự kiện nào đang diễn ra. Hãy khám phá ngay các sự kiện âm nhạc, thể thao và hội thảo hấp dẫn!
              </p>
              <div className="mt-6">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Khám phá sự kiện ngay
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* MODAL CẬP NHẬT ẢNH ĐẠI DIỆN VỚI CLOUDINARY */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Cập nhật ảnh đại diện
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tải ảnh từ thiết bị của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAvatarModal}
                disabled={uploadingAvatar}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Thông báo lỗi */}
            {avatarError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{avatarError}</span>
              </div>
            )}

            {/* Thông báo thành công */}
            {avatarSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{avatarSuccess}</span>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* KHU VỰC TẢI LÊN CLOUDINARY */}
            <div className="mb-5">

              {filePreview ? (
                /* Xem trước ảnh đã chọn */
                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-center">
                  <div className="relative mx-auto mb-3 h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-md">
                    <img
                      src={filePreview}
                      alt="Preview Avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-xs mx-auto">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                  </p>

                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Chọn ảnh khác
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadAvatar}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Tải lên & Lưu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Dropzone kéo thả */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${isDragging
                    ? "border-blue-500 bg-blue-50/70 scale-[1.01]"
                    : "border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    Kéo thả ảnh vào đây hoặc{" "}
                    <span className="text-blue-600 underline">chọn từ thiết bị</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Định dạng hỗ trợ: PNG, JPG, JPEG, WEBP (Tối đa 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Tùy chọn đóng hoặc chọn ảnh khác */}

            {/* Đóng modal */}
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleCloseAvatarModal}
                disabled={uploadingAvatar}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU (KHÔNG CẦN OTP) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Đổi mật khẩu
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nhập mật khẩu hiện tại và mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Thông báo lỗi */}
            {pwdError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {/* Thông báo thành công */}
            {pwdSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {/* Form đổi mật khẩu */}
            <form onSubmit={handleChangePassword} noValidate className="space-y-4">
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-600">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPwdError("");
                    }}
                    placeholder="Nhập mật khẩu hiện tại của bạn"
                    disabled={pwdLoading}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-600">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwdError("");
                    }}
                    placeholder="Nhập mật khẩu mới"
                    disabled={pwdLoading}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-600">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPwdError("");
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={pwdLoading}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={pwdLoading}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {pwdLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

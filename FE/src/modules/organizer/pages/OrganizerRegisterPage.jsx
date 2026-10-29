import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import {
  registerOrganizer,
  getMyOrganizerRequest,
  updateOrganizerRequest,
  cancelOrganizerRequest,
  uploadVerificationDocument,
} from "../services/organizerService";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  UploadCloud,
  Loader2,
  ChevronRight,
  Sparkles,
  Ticket,
  Calendar,
  CreditCard,
  Headphones,
  RotateCcw,
} from "lucide-react";

function OrganizerRegisterPage() {
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();

  // Page state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Existing request data
  const [existingStatus, setExistingStatus] = useState(null); // { currentRole, isOrganizer, latestRequest }
  const [isEditing, setIsEditing] = useState(false);

  // Form inputs
  const [organizerType, setOrganizerType] = useState("INDIVIDUAL"); // 'INDIVIDUAL' | 'BUSINESS'
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState(authUser?.email || "");
  const [contactPhone, setContactPhone] = useState(authUser?.phone || "");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // Legal / Identity
  const [idCardNumber, setIdCardNumber] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [idFrontImage, setIdFrontImage] = useState("");
  const [idBackImage, setIdBackImage] = useState("");
  const [businessLicense, setBusinessLicense] = useState("");

  // Uploading states
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Terms agreement
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    fetchMyRequest();
  }, []);

  const fetchMyRequest = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyOrganizerRequest();
      const data = response.data;
      setExistingStatus(data);

      if (data?.latestRequest) {
        const req = data.latestRequest;
        setOrganizerType(req.organizerType || "INDIVIDUAL");
        setOrganizationName(req.organizationName || "");
        setContactEmail(req.contactEmail || authUser?.email || "");
        setContactPhone(req.contactPhone || authUser?.phone || "");
        setAddress(req.address || "");
        setWebsite(req.website || "");
        setDescription(req.description || "");
        setIdCardNumber(req.idCardNumber || "");
        setTaxCode(req.taxCode || "");
        setIdFrontImage(req.idFrontImage || "");
        setIdBackImage(req.idBackImage || "");
        setBusinessLicense(req.businessLicense || "");
      }
    } catch (err) {
      console.error("Error fetching organizer request:", err);
      // Nếu chưa có request thì không sao
    } finally {
      setLoading(false);
    }
  };

  // Upload image handler
  const handleUploadFile = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Dung lượng file tối đa là 5MB");
      return;
    }

    setError("");
    try {
      if (type === "front") setUploadingFront(true);
      if (type === "back") setUploadingBack(true);
      if (type === "license") setUploadingLicense(true);

      const res = await uploadVerificationDocument(file);
      const url = res.data?.secure_url || res.data?.url;

      if (type === "front") setIdFrontImage(url);
      if (type === "back") setIdBackImage(url);
      if (type === "license") setBusinessLicense(url);
    } catch (err) {
      setError(err.message || "Tải tài liệu lên thất bại");
    } finally {
      if (type === "front") setUploadingFront(false);
      if (type === "back") setUploadingBack(false);
      if (type === "license") setUploadingLicense(false);
    }
  };

  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!organizationName.trim() || organizationName.trim().length < 2) {
      setError("Tên tổ chức / Đơn vị tổ chức phải có tối thiểu 2 ký tự");
      return;
    }

    if (!contactEmail.trim()) {
      setError("Vui lòng nhập email liên hệ");
      return;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(contactPhone.trim())) {
      setError("Số điện thoại liên hệ không đúng định dạng (VD: 0987654321)");
      return;
    }

    if (organizerType === "INDIVIDUAL" && !idCardNumber.trim()) {
      setError("Vui lòng nhập số CCCD / Hộ chiếu cá nhân");
      return;
    }

    if (organizerType === "BUSINESS" && !taxCode.trim()) {
      setError("Vui lòng nhập Mã số thuế doanh nghiệp");
      return;
    }

    if (!agreedTerms) {
      setError("Bạn cần đồng ý với Điều khoản & Quy định dành cho Ban Tổ Chức để tiếp tục");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        organizerType,
        organizationName: organizationName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        address: address.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
        idCardNumber: organizerType === "INDIVIDUAL" ? idCardNumber.trim() || null : null,
        idFrontImage: organizerType === "INDIVIDUAL" ? idFrontImage || null : null,
        idBackImage: organizerType === "INDIVIDUAL" ? idBackImage || null : null,
        taxCode: organizerType === "BUSINESS" ? taxCode.trim() || null : null,
        businessLicense: organizerType === "BUSINESS" ? businessLicense || null : null,
      };

      if (isEditing && existingStatus?.latestRequest?.id) {
        await updateOrganizerRequest(existingStatus.latestRequest.id, payload);
        setSuccess("Cập nhật đơn đăng ký Ban Tổ Chức thành công!");
      } else {
        await registerOrganizer(payload);
        setSuccess("Gửi đơn đăng ký Ban Tổ Chức thành công! Ban quản trị sẽ sớm xét duyệt.");
      }

      setIsEditing(false);
      await fetchMyRequest();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Gửi yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel request handler
  const handleCancelRequest = async () => {
    if (!existingStatus?.latestRequest?.id) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đăng ký Ban Tổ Chức này không?")) return;

    try {
      setLoading(true);
      await cancelOrganizerRequest(existingStatus.latestRequest.id);
      setSuccess("Đã hủy đơn đăng ký thành công");
      await fetchMyRequest();
    } catch (err) {
      setError(err.message || "Hủy đơn đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const latestReq = existingStatus?.latestRequest;
  const isApproved = existingStatus?.isOrganizer || authUser?.role === "ORGANIZER";
  const isPending = latestReq && latestReq.status === "PENDING" && !isEditing;
  const isRejected = latestReq && latestReq.status === "REJECTED" && !isEditing;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 pb-16">
        {/* HERO BANNER SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 py-14 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),transparent_50%)]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-sm ring-1 ring-blue-400/30">
                <Sparkles className="h-3.5 w-3.5" />
                Dành cho Đối tác & Nhà tổ chức
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Đăng ký trở thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Ban Tổ Chức</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base text-gray-300 sm:text-lg">
                Đưa sự kiện âm nhạc, thể thao và văn hóa của bạn tiếp cận hàng triệu khán giả trẻ trên toàn quốc thông qua nền tảng vé điện tử VTicket.
              </p>
            </div>

            {/* 4 Lợi thế nổi bật */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
                <Ticket className="h-6 w-6 text-blue-400 mb-2" />
                <h4 className="font-semibold text-sm text-white">Bán vé nhanh chóng</h4>
                <p className="mt-1 text-xs text-gray-400">Tạo loại vé, đặt giá và mở bán tức thì trong 5 phút.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
                <Calendar className="h-6 w-6 text-indigo-400 mb-2" />
                <h4 className="font-semibold text-sm text-white">Sơ đồ ghế trực quan</h4>
                <p className="mt-1 text-xs text-gray-400">Thiết kế phân khu và chọn ghế ngồi động theo từng suất diễn.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
                <CreditCard className="h-6 w-6 text-emerald-400 mb-2" />
                <h4 className="font-semibold text-sm text-white">Thanh toán đa dạng</h4>
                <p className="mt-1 text-xs text-gray-400">Tích hợp MoMo, VNPAY, ZaloPay & đối soát tự động.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
                <Headphones className="h-6 w-6 text-amber-400 mb-2" />
                <h4 className="font-semibold text-sm text-white">Hỗ trợ check-in sự kiện</h4>
                <p className="mt-1 text-xs text-gray-400">Ứng dụng quét mã QR vé siêu tốc, chống vé giả tuyệt đối.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTAINER CHÍNH */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 -mt-6">
          {/* Thông báo Error / Success */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}



          {/* TRƯỜNG HỢP 1: TÀI KHOẢN ĐÃ LÀ ORGANIZER */}
          {isApproved && (
            <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Bạn đã là Ban Tổ Chức chính thức
              </h2>
              <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
                Tài khoản của bạn đã được cấp quyền ORGANIZER. Bạn có thể truy cập ngay trang quản lý sự kiện để tạo và phát hành vé sự kiện mới.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/organizer/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
                >
                  <Calendar className="h-4 w-4" />
                  Đến trang quản lý sự kiện
                </Link>
                <Link
                  to="/profile"
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Xem hồ sơ cá nhân
                </Link>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: ĐƠN ĐANG CHỜ DUYỆT (PENDING) */}
          {!isApproved && isPending && (
            <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-gray-100 pb-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Clock className="h-8 w-8 animate-pulse" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Hồ sơ đăng ký đang chờ xét duyệt
                    </h2>
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800">
                      Chờ duyệt (PENDING)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Đã nộp lúc: {new Date(latestReq.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h4 className="text-xs font-semibold uppercase text-gray-400 mb-3">
                  Tóm tắt thông tin đã gửi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tên tổ chức:</span>{" "}
                    <strong className="text-gray-900">{latestReq.organizationName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Loại hình:</span>{" "}
                    <strong className="text-gray-900">
                      {latestReq.organizerType === "BUSINESS" ? "Doanh nghiệp / Tổ chức" : "Cá nhân"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Email liên hệ:</span>{" "}
                    <span className="text-gray-800">{latestReq.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Số điện thoại:</span>{" "}
                    <span className="text-gray-800">{latestReq.contactPhone}</span>
                  </div>
                  {latestReq.address && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Địa chỉ:</span>{" "}
                      <span className="text-gray-800">{latestReq.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center sm:text-left">
                ℹ️ Thời gian xét duyệt thường kéo dài từ 24 đến 48 giờ làm việc. Bạn sẽ nhận được email thông báo ngay khi hồ sơ được phê duyệt.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  Hủy đơn đăng ký
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 3: ĐƠN BỊ TỪ CHỐI (REJECTED) */}
          {!isApproved && isRejected && (
            <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-lg mb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <XCircle className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      Hồ sơ đăng ký chưa được duyệt
                    </h3>
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Từ chối
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-sm text-red-800">
                    <p className="font-semibold">Lý do từ chối:</p>
                    <p className="mt-1">{latestReq.rejectReason || "Hồ sơ chưa đáp ứng tiêu chuẩn đối tác của VTicket."}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Cập nhật lại thông tin & Gửi lại hồ sơ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM ĐĂNG KÝ LÀM BAN TỔ CHỨC */}
          {(!isApproved && (!latestReq || isEditing || latestReq.status === "CANCELLED")) && (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl sm:p-10">
              <div className="border-b border-gray-100 pb-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Cập nhật đơn đăng ký Ban Tổ Chức" : "Thông tin đăng ký Ban Tổ Chức"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng cung cấp đầy đủ thông tin bên dưới để Ban quản trị VTicket xét duyệt tài khoản của bạn.
                </p>
              </div>

              {/* PHẦN 1: LOẠI HÌNH TỔ CHỨC */}
              <div className="mb-8">
                <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">
                  1. Chọn loại hình tổ chức <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cá nhân */}
                  <label
                    onClick={() => setOrganizerType("INDIVIDUAL")}
                    className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 cursor-pointer transition ${
                      organizerType === "INDIVIDUAL"
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="organizerType"
                      checked={organizerType === "INDIVIDUAL"}
                      onChange={() => setOrganizerType("INDIVIDUAL")}
                      className="mt-1 h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-blue-600" />
                        Cá nhân / Nghệ sĩ độc lập
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dành cho cá nhân tự đứng ra tổ chức workshop, talkshow, giải đấu nhỏ hoặc minishow.
                      </p>
                    </div>
                  </label>

                  {/* Doanh nghiệp */}
                  <label
                    onClick={() => setOrganizerType("BUSINESS")}
                    className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 cursor-pointer transition ${
                      organizerType === "BUSINESS"
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="organizerType"
                      checked={organizerType === "BUSINESS"}
                      onChange={() => setOrganizerType("BUSINESS")}
                      className="mt-1 h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Công ty / Doanh nghiệp / Tổ chức
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dành cho các công ty giải trí, truyền thông, doanh nghiệp có mã số thuế và giấy phép ĐKKD.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN CƠ BẢN */}
              <div className="mb-8">
                <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">
                  2. Thông tin liên hệ cơ bản
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tên tổ chức */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Tên tổ chức / Thương hiệu BTC <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="VD: Công ty TNHH Giải trí V-Live hoặc CLB Âm nhạc Trẻ"
                        required
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Email liên hệ */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Email liên hệ chính thức <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="organizer@example.com"
                        required
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0987654321"
                        required
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Địa chỉ văn phòng / trụ sở
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Website / Fanpage */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Website / Trang Fanpage Facebook chính thức
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Globe className="h-4 w-4" />
                      </div>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://facebook.com/my-event-organizer"
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: THÔNG TIN PHÁP LÝ & GIẤY TỜ XÁC MINH */}
              <div className="mb-8">
                <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">
                  3. Thông tin pháp lý & Tài liệu xác minh
                </label>

                {organizerType === "INDIVIDUAL" ? (
                  /* Form dành cho CÁ NHÂN */
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Số CCCD / Hộ chiếu cá nhân <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        placeholder="Nhập 12 chữ số CCCD gắn chip"
                        required
                        className="w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mặt trước CCCD */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          Ảnh CCCD mặt trước
                        </label>
                        {idFrontImage ? (
                          <div className="relative overflow-hidden rounded-xl border border-gray-200">
                            <img src={idFrontImage} alt="Mặt trước CCCD" className="h-32 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setIdFrontImage("")}
                              className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 transition">
                            <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-xs font-medium text-gray-600">
                              {uploadingFront ? "Đang tải ảnh lên..." : "Tải ảnh mặt trước"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadFile(e, "front")}
                              disabled={uploadingFront}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Mặt sau CCCD */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          Ảnh CCCD mặt sau
                        </label>
                        {idBackImage ? (
                          <div className="relative overflow-hidden rounded-xl border border-gray-200">
                            <img src={idBackImage} alt="Mặt sau CCCD" className="h-32 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setIdBackImage("")}
                              className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 transition">
                            <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-xs font-medium text-gray-600">
                              {uploadingBack ? "Đang tải ảnh lên..." : "Tải ảnh mặt sau"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadFile(e, "back")}
                              disabled={uploadingBack}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Form dành cho DOANH NGHIỆP */
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Mã số thuế doanh nghiệp (MST) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="VD: 0101234567"
                        required
                        className="w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Ảnh Giấy phép đăng ký kinh doanh (GPKD)
                      </label>
                      {businessLicense ? (
                        <div className="relative overflow-hidden rounded-xl border border-gray-200">
                          <img src={businessLicense} alt="GPKD" className="h-40 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBusinessLicense("")}
                            className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 transition">
                          <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-xs font-medium text-gray-600">
                            {uploadingLicense ? "Đang tải ảnh lên..." : "Tải lên ảnh giấy phép kinh doanh"}
                          </span>
                          <span className="text-[11px] text-gray-400 mt-0.5">JPG, PNG hoặc WEBP (Tối đa 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadFile(e, "license")}
                            disabled={uploadingLicense}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Giới thiệu đơn vị */}
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Giới thiệu kinh nghiệm tổ chức sự kiện & Kế hoạch sắp tới
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn gọn về các chương trình, minishow, hội thảo bạn từng tổ chức hoặc kế hoạch sự kiện dự kiến tổ chức trên VTicket..."
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* PHẦN 4: ĐIỀU KHOẢN & QUY ĐỊNH DÀNH CHO BAN TỔ CHỨC */}
              <div className="mb-8">
                <label className="text-xs font-semibold uppercase text-gray-600 block mb-2">
                  4. Điều khoản & Quy định dành cho Ban Tổ Chức (VTicket Partner Terms)
                </label>

                {/* Khung cuộn văn bản điều khoản */}
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-xs text-gray-600 leading-relaxed space-y-3">
                  <h5 className="font-bold text-gray-800 text-sm">QUY CHẾ HOẠT ĐỘNG VÀ ĐIỀU KHOẢN HỢP TÁC BAN TỔ CHỨC</h5>
                  
                  <div>
                    <strong className="text-gray-800">Điều 1: Tính hợp pháp của sự kiện</strong>
                    <p>Ban Tổ Chức (BTC) cam kết sở hữu đầy đủ giấy phép biểu diễn, văn bản chấp thuận từ các cơ quan có thẩm quyền theo quy định của pháp luật Việt Nam. BTC chịu hoàn toàn trách nhiệm pháp lý đối với nội dung sự kiện và bản quyền tác phẩm.</p>
                  </div>

                  <div>
                    <strong className="text-gray-800">Điều 2: Phát hành vé và kiểm soát vé</strong>
                    <p>Mọi vé được phát hành qua nền tảng VTicket đều mang mã định danh duy nhất (QR Token bảo mật). BTC có trách nhiệm sử dụng ứng dụng kiểm soát vé của VTicket để bảo đảm quyền lợi chính đáng cho người tham gia.</p>
                  </div>

                  <div>
                    <strong className="text-gray-800">Điều 3: Chính sách hoãn, hủy sự kiện và hoàn tiền</strong>
                    <p>Trong trường hợp sự kiện bị hoãn, thay đổi địa điểm hoặc bị hủy bỏ vì bất kỳ lý do gì, BTC có nghĩa vụ thông báo kịp thời cho VTicket và chịu trách nhiệm hoàn 100% giá trị tiền vé cho khách hàng theo đúng chính sách bảo vệ người tiêu dùng.</p>
                  </div>

                  <div>
                    <strong className="text-gray-800">Điều 4: Đối soát doanh thu và thanh toán</strong>
                    <p>VTicket sẽ đối soát doanh thu bán vé trừ đi phí dịch vụ nền tảng theo hợp đồng đã thống nhất. Tiền doanh thu sẽ được chuyển khoản vào tài khoản ngân hàng của BTC trong vòng từ 03 đến 05 ngày làm việc sau khi sự kiện kết thúc thành công và không có khiếu nại phát sinh.</p>
                  </div>

                  <div>
                    <strong className="text-gray-800">Điều 5: Bảo mật thông tin khách hàng</strong>
                    <p>BTC cam kết bảo mật tuyệt đối thông tin cá nhân của người mua vé và chỉ sử dụng cho mục đích vận hành, điều phối sự kiện theo quy định của Luật An ninh mạng.</p>
                  </div>
                </div>

                {/* Checkbox đồng ý điều khoản */}
                <div className="mt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-xs text-gray-700 font-medium select-none">
                      Tôi xác nhận đã đọc, hiểu rõ và cam kết tuân thủ toàn bộ{" "}
                      <strong className="text-blue-600">Điều khoản & Quy định dành cho Ban Tổ Chức</strong> của VTicket.
                    </span>
                  </label>
                </div>
              </div>

              {/* NÚT SUBMIT */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={submitting}
                    className="w-full sm:w-auto rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !agreedTerms}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý hồ sơ...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      {isEditing ? "Lưu thay đổi hồ sơ" : "Gửi hồ sơ đăng ký Ban Tổ Chức"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrganizerRegisterPage;

import { useState, useEffect } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";

import OrganizerHeroBanner from "../components/OrganizerHeroBanner";
import OrganizerStatusCards from "../components/OrganizerStatusCards";
import OrganizerBasicInfoForm from "../components/OrganizerBasicInfoForm";
import OrganizerLegalDocuments from "../components/OrganizerLegalDocuments";
import OrganizerTermsSection from "../components/OrganizerTermsSection";

function OrganizerRegisterPage() {
  const { user: authUser } = useAuth();

  // Page state
  const [, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Existing request data
  const [existingStatus, setExistingStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form inputs
  const [organizerType, setOrganizerType] = useState("INDIVIDUAL");
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
  const showForm = !isApproved && (!latestReq || isEditing || latestReq.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 pb-16">
        {/* 1. HERO BANNER */}
        <OrganizerHeroBanner />

        {/* 2. CONTAINER CHÍNH */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 mt-8 sm:mt-10">
          {/* Thông báo Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 3. CÁC CARD TRẠNG THÁI (ĐÃ DUYỆT / CHỜ DUYỆT / TỪ CHỐI) */}
          <OrganizerStatusCards
            isApproved={isApproved}
            isPending={isPending}
            isRejected={isRejected}
            latestReq={latestReq}
            onCancelRequest={handleCancelRequest}
            onStartEditing={() => setIsEditing(true)}
          />

          {/* 4. FORM ĐĂNG KÝ LÀM BAN TỔ CHỨC */}
          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl sm:p-10">
              <div className="border-b border-gray-100 pb-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Cập nhật đơn đăng ký Ban Tổ Chức" : "Thông tin đăng ký Ban Tổ Chức"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng cung cấp đầy đủ thông tin bên dưới để Ban quản trị VTicket xét duyệt tài khoản của bạn.
                </p>
              </div>

              {/* Phần 1 & 2: Loại hình & Thông tin liên hệ cơ bản */}
              <OrganizerBasicInfoForm
                organizerType={organizerType}
                setOrganizerType={setOrganizerType}
                organizationName={organizationName}
                setOrganizationName={setOrganizationName}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                address={address}
                setAddress={setAddress}
                website={website}
                setWebsite={setWebsite}
              />

              {/* Phần 3: Giấy tờ pháp lý & Upload tài liệu */}
              <OrganizerLegalDocuments
                organizerType={organizerType}
                idCardNumber={idCardNumber}
                setIdCardNumber={setIdCardNumber}
                idFrontImage={idFrontImage}
                setIdFrontImage={setIdFrontImage}
                idBackImage={idBackImage}
                setIdBackImage={setIdBackImage}
                taxCode={taxCode}
                setTaxCode={setTaxCode}
                businessLicense={businessLicense}
                setBusinessLicense={setBusinessLicense}
                description={description}
                setDescription={setDescription}
                uploadingFront={uploadingFront}
                uploadingBack={uploadingBack}
                uploadingLicense={uploadingLicense}
                handleUploadFile={handleUploadFile}
              />

              {/* Phần 4: Điều khoản quy định & Nút submit */}
              <OrganizerTermsSection
                agreedTerms={agreedTerms}
                setAgreedTerms={setAgreedTerms}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                submitting={submitting}
              />
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrganizerRegisterPage;

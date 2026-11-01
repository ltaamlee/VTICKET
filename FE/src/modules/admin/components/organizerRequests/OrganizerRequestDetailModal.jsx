import {
  Building2,
  X,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  Loader2,
} from "lucide-react";

export default function OrganizerRequestDetailModal({
  show,
  onClose,
  request,
  loading,
  onOpenApprove,
  onOpenReject,
  onZoomImage,
}) {
  if (!show) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
            <Clock className="h-3.5 w-3.5" />
            Chờ xét duyệt
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã phê duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-600/20">
            <XCircle className="h-3.5 w-3.5" />
            Đã từ chối
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Chi tiết hồ sơ đăng ký Ban Tổ Chức
              </h3>
              <p className="text-xs text-gray-500">Mã đơn: {request?.id || "..."}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !request ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
              <p>Đang tải chi tiết hồ sơ...</p>
            </div>
          ) : (
            <>
              {/* Trạng thái hiện tại */}
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Trạng thái xét duyệt</p>
                  <div className="mt-1">{getStatusBadge(request.status)}</div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Ngày nộp: {new Date(request.createdAt).toLocaleString("vi-VN")}</p>
                  {request.reviewedAt && (
                    <p className="mt-0.5">
                      Ngày duyệt: {new Date(request.reviewedAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
              </div>

              {/* Lý do từ chối nếu có */}
              {request.status === "REJECTED" && request.rejectReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Lý do từ chối:
                  </p>
                  <p>{request.rejectReason}</p>
                </div>
              )}

              {/* PHẦN 1: THÔNG TIN TỔ CHỨC */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  1. Thông tin Đơn vị / Tổ chức
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-gray-100 p-4 bg-white shadow-sm">
                  <div>
                    <p className="text-xs text-gray-500">Tên tổ chức:</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                      {request.organizationName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Loại hình:</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">
                      {request.organizerType === "BUSINESS" ? "Doanh nghiệp / Công ty" : "Cá nhân / CLB"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Địa chỉ:</p>
                    <p className="font-medium text-gray-900 text-sm mt-0.5">
                      {request.address || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Website / Mạng xã hội:</p>
                    {request.website ? (
                      <a
                        href={request.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline text-sm mt-0.5 inline-flex items-center gap-1"
                      >
                        {request.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-gray-400 text-sm mt-0.5">Chưa cập nhật</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Mô tả hoạt động:</p>
                    <p className="text-gray-700 text-sm mt-0.5 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {request.description || "Không có mô tả"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN LIÊN HỆ & TÀI KHOẢN NỘP */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  2. Người đại diện & Tài khoản gửi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border border-gray-100 p-4 bg-white shadow-sm text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Họ tên người nộp:</p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {request.user?.fullName || request.applicant?.fullName || request.user?.email || request.contactEmail}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Email liên hệ:</p>
                    <p className="font-medium text-gray-900 mt-0.5">{request.contactEmail}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại:</p>
                    <p className="font-medium text-gray-900 mt-0.5">{request.contactPhone}</p>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: GIẤY TỜ ĐỊNH DANH & PHÁP LÝ */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  3. Giấy tờ định danh & Pháp lý
                </h4>
                <div className="rounded-2xl border border-gray-100 p-4 bg-white shadow-sm space-y-4">
                  {request.organizerType === "INDIVIDUAL" ? (
                    <>
                      <div>
                        <p className="text-xs text-gray-500">Số CCCD / Hộ chiếu:</p>
                        <p className="font-mono font-bold text-gray-900 text-base mt-0.5">
                          {request.idCardNumber || "Chưa cung cấp"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Ảnh mặt trước */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Ảnh CCCD Mặt trước:</p>
                          {request.idFrontImage ? (
                            <div
                              className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 max-h-48 flex items-center justify-center"
                              onClick={() => onZoomImage(request.idFrontImage)}
                            >
                              <img
                                src={request.idFrontImage}
                                alt="Mặt trước CCCD"
                                className="w-full object-cover transition group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                                Bấm để phóng to
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                              Chưa tải lên ảnh mặt trước
                            </div>
                          )}
                        </div>

                        {/* Ảnh mặt sau */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Ảnh CCCD Mặt sau:</p>
                          {request.idBackImage ? (
                            <div
                              className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 max-h-48 flex items-center justify-center"
                              onClick={() => onZoomImage(request.idBackImage)}
                            >
                              <img
                                src={request.idBackImage}
                                alt="Mặt sau CCCD"
                                className="w-full object-cover transition group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                                Bấm để phóng to
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                              Chưa tải lên ảnh mặt sau
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-gray-500">Mã số thuế doanh nghiệp:</p>
                        <p className="font-mono font-bold text-gray-900 text-base mt-0.5">
                          {request.taxCode || "Chưa cung cấp"}
                        </p>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Giấy phép ĐKKD:</p>
                        {request.businessLicense ? (
                          <div
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 max-h-64 flex items-center justify-center max-w-sm"
                            onClick={() => onZoomImage(request.businessLicense)}
                          >
                            <img
                              src={request.businessLicense}
                              alt="Giấy phép kinh doanh"
                              className="w-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                              Bấm để phóng to
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                            Chưa tải lên giấy phép ĐKKD
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Modal: Nút Duyệt / Từ chối nếu PENDING */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Đóng
          </button>

          {request?.status === "PENDING" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenReject(request)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
              >
                <X className="h-4 w-4" />
                Từ chối đơn
              </button>
              <button
                type="button"
                onClick={() => onOpenApprove(request)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md transition"
              >
                <Check className="h-4 w-4" />
                Phê duyệt BTC
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

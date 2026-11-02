import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Calendar,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";

export default function OrganizerStatusCards({
  isApproved,
  isPending,
  isRejected,
  latestReq,
  onCancelRequest,
  onStartEditing,
}) {
  return (
    <>
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
      {!isApproved && isPending && latestReq && (
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
                  Chờ duyệt
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
              onClick={onCancelRequest}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
            >
              Hủy đơn đăng ký
            </button>
            <button
              type="button"
              onClick={onStartEditing}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      )}

      {/* TRƯỜNG HỢP 3: ĐƠN BỊ TỪ CHỐI (REJECTED) */}
      {!isApproved && isRejected && latestReq && (
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
                  onClick={onStartEditing}
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
    </>
  );
}

import {
  Building2,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Eye,
  Check,
  X,
  Loader2,
} from "lucide-react";

export default function OrganizerRequestTable({
  requests,
  loading,
  onViewDetail,
  onOpenApprove,
  onOpenReject,
}) {
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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50/80 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-5 py-4">Tên Đơn vị / Tổ chức</th>
            <th className="px-5 py-4">Loại hình</th>
            <th className="px-5 py-4">Người nộp & Liên hệ</th>
            <th className="px-5 py-4">Ngày nộp</th>
            <th className="px-5 py-4">Trạng thái</th>
            <th className="px-5 py-4 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  <span>Đang tải dữ liệu đơn đăng ký...</span>
                </div>
              </td>
            </tr>
          ) : requests.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-600">Không có đơn đăng ký nào</p>
                  <p className="text-xs">Không tìm thấy yêu cầu phù hợp với bộ lọc hiện tại</p>
                </div>
              </td>
            </tr>
          ) : (
            requests.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/60 transition">
                {/* Tên tổ chức */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                      {item.organizationName?.charAt(0)?.toUpperCase() || "B"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate max-w-xs">
                        {item.organizationName}
                      </p>
                      {item.address && (
                        <p className="text-xs text-gray-400 truncate max-w-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {item.address}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Loại hình */}
                <td className="px-5 py-4 whitespace-nowrap">
                  {item.organizerType === "BUSINESS" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-600/20">
                      <Building2 className="h-3 w-3" />
                      Doanh nghiệp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                      <User className="h-3 w-3" />
                      Cá nhân
                    </span>
                  )}
                </td>

                {/* Người nộp & Liên hệ */}
                <td className="px-5 py-4">
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900 text-xs sm:text-sm">
                      {item.user?.fullName || item.applicant?.fullName || item.user?.email || item.contactEmail || "Người dùng"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {item.contactEmail}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {item.contactPhone}
                    </p>
                  </div>
                </td>

                {/* Ngày nộp */}
                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—"}
                </td>

                {/* Trạng thái */}
                <td className="px-5 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>

                {/* Thao tác */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Nút Xem chi tiết */}
                    <button
                      type="button"
                      onClick={() => onViewDetail(item.id)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                      title="Xem chi tiết hồ sơ"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Nếu đang PENDING: Hiện nút Duyệt và Từ chối nhanh */}
                    {item.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenApprove(item)}
                          className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 transition shadow-sm"
                          title="Phê duyệt đơn này"
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenReject(item)}
                          className="rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-700 transition shadow-sm"
                          title="Từ chối đơn này"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

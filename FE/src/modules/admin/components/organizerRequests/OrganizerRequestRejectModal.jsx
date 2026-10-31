import { XCircle, X, AlertCircle, Loader2 } from "lucide-react";

export default function OrganizerRequestRejectModal({
  show,
  onClose,
  targetRequest,
  rejectReason,
  onRejectReasonChange,
  rejectError,
  onConfirmReject,
  rejecting,
}) {
  if (!show || !targetRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Từ chối đơn đăng ký Ban Tổ Chức
              </h3>
              <p className="text-xs text-gray-500">Đơn vị: {targetRequest.organizationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onConfirmReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="Ví dụ: Ảnh chụp CCCD bị mờ, không nhìn rõ số định danh cá nhân. Vui lòng chụp lại rõ nét và cập nhật hồ sơ..."
              className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Lý do này sẽ được gửi trực tiếp tới email của người nộp đơn để họ nắm rõ.
            </p>
            {rejectError && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {rejectError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={rejecting}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={rejecting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition disabled:opacity-50"
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận từ chối"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

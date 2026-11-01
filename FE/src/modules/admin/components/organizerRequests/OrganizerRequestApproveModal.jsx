import { CheckCircle2, Check, Loader2 } from "lucide-react";

export default function OrganizerRequestApproveModal({
  show,
  onClose,
  targetRequest,
  onConfirmApprove,
  approving,
}) {
  if (!show || !targetRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-gray-900">
          Xác nhận phê duyệt Ban Tổ Chức?
        </h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Bạn đang phê duyệt cho đơn vị <strong>"{targetRequest.organizationName}"</strong>.
          Tài khoản người dùng (<strong>{targetRequest.contactEmail}</strong>) sẽ được nâng cấp thành vai trò <strong>ORGANIZER</strong> và nhận email chúc mừng.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={approving}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmApprove}
            disabled={approving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Xác nhận duyệt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { KeyRound } from "lucide-react";

export default function SecurityTab({ profile, handleOpenPasswordModal }) {
  return (
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
  );
}

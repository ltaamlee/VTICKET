import { User, Mail, Phone, Calendar, Save, RotateCcw } from "lucide-react";

export default function PersonalInfoTab({
  loading,
  profile,
  fullName,
  setFullName,
  phone,
  setPhone,
  dob,
  setDob,
  saving,
  handleSubmit,
  handleResetForm,
}) {
  return (
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
  );
}

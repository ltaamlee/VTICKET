
import {
    AtSign,
    Phone,
    Calendar,
    Save,
    RotateCcw,
} from "lucide-react";

const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50";

export default function PersonalInfoTab({
    loading,
    profile,
    username,
    setUsername,
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
    if (loading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                    {[0, 1].map((index) => (
                        <div
                            key={index}
                            className="h-20 animate-pulse rounded-lg bg-gray-100"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-800">
                    Thông tin cá nhân
                </h3>

                <p className="mt-0.5 text-sm text-gray-500">
                    Cập nhật thông tin dùng để nhận diện và liên hệ với bạn.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                    {/* Họ và tên */}
                    <div>
                        <label
                            htmlFor="profile-fullName"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Họ và tên <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="profile-fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nhập họ và tên đầy đủ"
                            required
                            disabled={saving}
                            className={inputClass}
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label
                            htmlFor="profile-username"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Tên tài khoản (Username)
                        </label>

                        <div className="relative">
                            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                id="profile-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="VD: nguyenvana"
                                disabled={saving}
                                minLength={3}
                                maxLength={30}
                                className={`${inputClass} pl-10`}
                            />
                        </div>

                        <p className="mt-1.5 text-xs text-gray-400">
                            3–30 ký tự (chữ cái, số, dấu chấm, gạch dưới, gạch ngang).
                        </p>
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="profile-email"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Địa chỉ Email
                        </label>

                        <input
                            id="profile-email"
                            type="email"
                            value={profile?.email || ""}
                            disabled
                            className={`${inputClass} text-gray-500`}
                        />

                        <p className="mt-1.5 text-xs text-gray-400">
                            Email được dùng để đăng nhập và không thể thay đổi.
                        </p>
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label
                            htmlFor="profile-phone"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Số điện thoại
                        </label>

                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                id="profile-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ví dụ: 0912345678"
                                disabled={saving}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                        <label
                            htmlFor="profile-dob"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Ngày sinh
                        </label>

                        <div className="relative">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                id="profile-dob"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                disabled={saving}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button
                        type="button"
                        onClick={handleResetForm}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RotateCcw className="h-4 w-4 text-gray-500" />
                        Khôi phục
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </section>
    );
}

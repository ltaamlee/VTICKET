export default function SecurityTab({ profile, handleOpenPasswordModal }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-800">
                    Tài khoản &amp; bảo mật
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">
                    Kiểm tra tình trạng tài khoản và cập nhật mật khẩu định kỳ.
                </p>
            </div>

            <div className="divide-y divide-gray-100 px-6">
                <div className="flex items-center justify-between gap-4 py-4 first:pt-5">
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                            Xác thực Email
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Dùng để đăng nhập và nhận vé điện tử.
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        Đã kích hoạt
                    </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                            Trạng thái tài khoản
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {profile?.status === "ACTIVE"
                                ? "Tài khoản đang hoạt động bình thường."
                                : "Tài khoản đang bị hạn chế."}
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {profile?.status || "ACTIVE"}
                    </span>
                </div>

                <div className="flex flex-col gap-4 py-4 last:pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                            Đổi mật khẩu
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ in hoa,
                            số và ký tự đặc biệt.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenPasswordModal}
                        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        Đổi mật khẩu
                    </button>
                </div>
            </div>
        </section>
    );
}

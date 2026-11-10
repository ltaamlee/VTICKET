import { useEffect, useState } from "react";
import {
    ShieldCheck,
    LockKeyhole,
    Monitor,
    RefreshCw,
    Save,
    LoaderCircle,
    CheckCircle,
} from "lucide-react";

import Button from "../../../components/common/button/Button";

import {
    getSettings,
    updateSettings,
} from "../services/systemService";

const initialForm = {
    password: {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: false,
    },
    loginProtection: {
        maxFailedAttempts: 5,
        lockoutDuration: 15,
    },
    session: {
        sessionTimeout: 60,
    },
};

function Security({ onAlert }) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Tải cấu hình bảo mật
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getSettings();
            const settings = response?.data ?? response;
            const security = settings?.security ?? {};

            setForm({
                password: {
                    ...initialForm.password,
                    ...security.password,
                },
                loginProtection: {
                    ...initialForm.loginProtection,
                    ...security.loginProtection,
                },
                session: {
                    ...initialForm.session,
                    ...security.session,
                },
            });
        } catch (err) {
            setError(err.message || "Không thể tải cấu hình bảo mật.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Cập nhật cấu hình
    const handleChange = (group, field, value) => {
        setForm((prev) => ({
            ...prev,
            [group]: {
                ...prev[group],
                [field]: value,
            },
        }));

        setError("");
    };

    // Lưu cấu hình
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        if (
            form.password.minLength < 8 ||
            form.password.minLength > 32
        ) {
            setError("Độ dài mật khẩu phải từ 8 đến 32 ký tự.");
            return;
        }

        if (
            form.loginProtection.maxFailedAttempts < 1 ||
            form.loginProtection.maxFailedAttempts > 20
        ) {
            setError("Số lần đăng nhập sai phải từ 1 đến 20.");
            return;
        }

        if (
            form.loginProtection.lockoutDuration < 1 ||
            form.loginProtection.lockoutDuration > 1440
        ) {
            setError("Thời gian khóa tài khoản phải từ 1 đến 1440 phút.");
            return;
        }

        if (
            form.session.sessionTimeout < 5 ||
            form.session.sessionTimeout > 1440
        ) {
            setError("Thời gian phiên đăng nhập phải từ 5 đến 1440 phút.");
            return;
        }

        try {
            setSaving(true);

            await updateSettings("security", form);

            onAlert?.({
                variant: "success",
                title: "Thành công",
                message: "Cập nhật cấu hình bảo mật thành công.",
                icon: CheckCircle,
            });
        } catch (err) {
            setError(err.message || "Không thể lưu cấu hình bảo mật.");
        } finally {
            setSaving(false);
        }
    };

    // Toggle
    const renderToggle = (group, field, label, description) => {
        const enabled = form[group][field];

        return (
            <div className="flex items-center justify-between gap-4 py-4">
                <div>
                    <p className="font-medium text-gray-800">{label}</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {description}
                    </p>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => handleChange(group, field, !enabled)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        enabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                    <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            enabled ? "left-6" : "left-1"
                        }`}
                    />
                </button>
            </div>
        );
    };

    // Input số
    const renderNumberInput = (
        group,
        field,
        label,
        description,
        min,
        max,
        suffix
    ) => (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <label className="font-medium text-gray-800">
                    {label}
                </label>
                <p className="mt-1 text-sm text-gray-500">
                    {description}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={form[group][field]}
                    onChange={(e) =>
                        handleChange(
                            group,
                            field,
                            e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                        )
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <span className="text-sm text-gray-500">{suffix}</span>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-500">
                <LoaderCircle size={22} className="mr-2 animate-spin" />
                Đang tải cấu hình bảo mật...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">

                {/* Chính sách mật khẩu */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <LockKeyhole size={20} />
                            Chính sách mật khẩu
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Thiết lập các yêu cầu đối với mật khẩu tài khoản.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {renderNumberInput(
                            "password",
                            "minLength",
                            "Độ dài mật khẩu tối thiểu",
                            "Số lượng ký tự tối thiểu mà mật khẩu phải có.",
                            8,
                            32,
                            "ký tự"
                        )}

                        <div className="divide-y divide-gray-100">
                            {renderToggle(
                                "password",
                                "requireUppercase",
                                "Yêu cầu chữ in hoa",
                                "Mật khẩu phải chứa ít nhất một chữ in hoa."
                            )}

                            {renderToggle(
                                "password",
                                "requireNumber",
                                "Yêu cầu chữ số",
                                "Mật khẩu phải chứa ít nhất một chữ số."
                            )}

                            {renderToggle(
                                "password",
                                "requireSpecialChar",
                                "Yêu cầu ký tự đặc biệt",
                                "Mật khẩu phải chứa ít nhất một ký tự đặc biệt."
                            )}
                        </div>
                    </div>
                </section>

                {/* Bảo vệ đăng nhập */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <ShieldCheck size={20} />
                            Bảo vệ đăng nhập
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Hạn chế các hành vi đăng nhập sai nhiều lần.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {renderNumberInput(
                            "loginProtection",
                            "maxFailedAttempts",
                            "Số lần đăng nhập sai tối đa",
                            "Số lần nhập sai mật khẩu trước khi khóa tài khoản.",
                            1,
                            20,
                            "lần"
                        )}

                        {renderNumberInput(
                            "loginProtection",
                            "lockoutDuration",
                            "Thời gian khóa tài khoản",
                            "Thời gian tài khoản bị khóa sau khi vượt giới hạn.",
                            1,
                            1440,
                            "phút"
                        )}
                    </div>
                </section>

                {/* Phiên đăng nhập */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Monitor size={20} />
                            Quản lý phiên đăng nhập
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Thiết lập thời gian hiệu lực của phiên đăng nhập.
                        </p>
                    </div>

                    {renderNumberInput(
                        "session",
                        "sessionTimeout",
                        "Thời gian hết hạn phiên",
                        "Thời gian tối đa trước khi phiên đăng nhập hết hạn.",
                        5,
                        1440,
                        "phút"
                    )}
                </section>

                {/* Nút thao tác */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={loadSettings}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} />
                        Tải lại
                    </button>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                    >
                        {saving ? (
                            <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}

                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default Security;
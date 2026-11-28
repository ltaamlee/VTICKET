import { useEffect, useState } from "react";
import {
    CreditCard,
    RefreshCw,
    Save,
    ShieldCheck,
    Wallet,
    LoaderCircle,
    CheckCircle,
    Percent,
    Landmark,
    ArrowUpRight,
} from "lucide-react";

import Button from "../../../components/common/button/Button";

import {
    getSettings,
    updateSettings,
} from "../services/systemService";

const initialForm = {
    platformFeeRate: 2,
    environment: "SANDBOX",
    providers: {
        SEPAY: { enabled: true, displayName: "SePay" },
        PAYOS: { enabled: false, displayName: "PayOS" },
    },
    wallet: {
        enabled: true,
        allowWalletPayment: true,
        allowWithdraw: true,
        minTopUp: 10000,
        maxTopUp: 100000000,
        minWithdraw: 10000,
        maxWithdraw: 100000000,
        allowedRoles: ["USER", "ORGANIZER", "ADMIN"],
    },
};

const providers = [
    {
        key: "SEPAY",
        name: "SePay",
        description: "Cổng ngân hàng dùng để thanh toán đơn mua vé bán lại.",
        logo: null,
    },
    {
        key: "PAYOS",
        name: "PayOS",
        description: "Thanh toán bằng mã QR ngân hàng.",
        logo: "/images/payment/payos.png",
    },
];

const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50";

function Toggle({ enabled, onToggle, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            onClick={onToggle}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-blue-600" : "bg-gray-300"
                }`}
        >
            <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"
                    }`}
            />
        </button>
    );
}

function PaymentSetting({ onAlert }) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getSettings();
            const settings = response?.data ?? response;
            const payment = settings?.payment ?? {};

            setForm({
                ...initialForm,
                ...payment,
                providers: {
                    ...initialForm.providers,
                    ...(payment.providers || {}),
                },
                wallet: {
                    ...initialForm.wallet,
                    ...(payment.wallet || {}),
                },
            });
        } catch (err) {
            setError(err.message || "Không thể tải cấu hình thanh toán.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleProviderChange = (key) => {
        setForm((prev) => ({
            ...prev,
            providers: {
                ...prev.providers,
                [key]: {
                    ...prev.providers[key],
                    enabled: !prev.providers[key]?.enabled,
                },
            },
        }));
        setError("");
    };

    const handleWalletChange = (key, value) => {
        setForm((prev) => ({
            ...prev,
            wallet: {
                ...prev.wallet,
                [key]: value,
            },
        }));
        setError("");
    };

    const handleWalletRoleToggle = (role, checked) => {
        setForm((prev) => {
            const current = prev.wallet.allowedRoles || [];
            const next = checked
                ? [...current, role]
                : current.filter((item) => item !== role);

            return {
                ...prev,
                wallet: {
                    ...prev.wallet,
                    allowedRoles: next,
                },
            };
        });
        setError("");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        const feeRate = Number(form.platformFeeRate);

        if (!Number.isFinite(feeRate) || feeRate < 0 || feeRate > 100) {
            setError("Tỷ lệ phí sàn phải nằm trong khoảng 0–100%.");
            return;
        }

        if (!Object.values(form.providers).some((item) => item.enabled)) {
            setError("Vui lòng bật ít nhất một cổng thanh toán.");
            return;
        }

        const minTopUp = Number(form.wallet.minTopUp);
        const maxTopUp = Number(form.wallet.maxTopUp);
        const minWithdraw = Number(form.wallet.minWithdraw);
        const maxWithdraw = Number(form.wallet.maxWithdraw);

        if (form.wallet.enabled) {
            if (!Number.isFinite(minTopUp) || minTopUp < 0) {
                setError("Số tiền nạp tối thiểu không hợp lệ.");
                return;
            }

            if (!Number.isFinite(maxTopUp) || maxTopUp <= 0) {
                setError("Số tiền nạp tối đa không hợp lệ.");
                return;
            }

            if (maxTopUp < minTopUp) {
                setError("Số tiền nạp tối đa phải lớn hơn số tiền nạp tối thiểu.");
                return;
            }
        }

        if (form.wallet.allowWithdraw) {
            if (!Number.isFinite(minWithdraw) || minWithdraw < 0) {
                setError("Số tiền rút tối thiểu không hợp lệ.");
                return;
            }

            if (!Number.isFinite(maxWithdraw) || maxWithdraw <= 0) {
                setError("Số tiền rút tối đa không hợp lệ.");
                return;
            }

            if (maxWithdraw < minWithdraw) {
                setError("Số tiền rút tối đa phải lớn hơn số tiền rút tối thiểu.");
                return;
            }
        }

        try {
            setSaving(true);

            await updateSettings("payment", {
                platformFeeRate: feeRate,
                environment: form.environment,
                providers: form.providers,
                wallet: {
                    enabled: Boolean(form.wallet.enabled),
                    allowWalletPayment: Boolean(form.wallet.allowWalletPayment),
                    allowWithdraw: Boolean(form.wallet.allowWithdraw),
                    minTopUp: minTopUp,
                    maxTopUp: maxTopUp,
                    minWithdraw: minWithdraw,
                    maxWithdraw: maxWithdraw,
                    allowedRoles: form.wallet.allowedRoles,
                },
            });

            onAlert?.({
                variant: "success",
                title: "Thành công",
                message: "Cập nhật cấu hình thanh toán và ví điện tử thành công.",
                icon: CheckCircle,
            });
        } catch (err) {
            setError(err.message || "Không thể lưu cấu hình thanh toán.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-500">
                <LoaderCircle size={22} className="mr-2 animate-spin" />
                Đang tải cấu hình thanh toán...
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
                {/* Phí sàn + môi trường */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Percent size={20} />
                            Phí sàn & môi trường thanh toán
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Phí sàn được trừ khi người mua thanh toán thành công,
                            phần còn lại sẽ cộng vào ví của người bán.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="platformFeeRate"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Tỷ lệ phí sàn (%)
                            </label>
                            <div className="relative">
                                <input
                                    id="platformFeeRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={form.platformFeeRate}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            platformFeeRate: e.target.value,
                                        }))
                                    }
                                    className={`${inputClass} pr-12`}
                                />
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                    %
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Cho phép từ 0% đến 100%. Mặc định 2%.
                            </p>
                        </div>

                        <div>
                            <span className="mb-2 block text-sm font-medium text-gray-700">
                                Môi trường thanh toán
                            </span>
                            <div className="grid gap-3">
                                {[
                                    {
                                        value: "SANDBOX",
                                        title: "Sandbox",
                                        description:
                                            "Môi trường thử nghiệm, không giao dịch thật.",
                                    },
                                    {
                                        value: "PRODUCTION",
                                        title: "Production",
                                        description:
                                            "Môi trường hoạt động, thanh toán thực tế.",
                                    },
                                ].map((item) => (
                                    <label
                                        key={item.value}
                                        className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${form.environment === item.value
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="environment"
                                            value={item.value}
                                            checked={form.environment === item.value}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    environment: e.target.value,
                                                }))
                                            }
                                            className="mt-1 accent-blue-600"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {item.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {item.description}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cổng thanh toán */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <CreditCard size={20} />
                            Cổng thanh toán
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Bật hoặc tắt các cổng thanh toán được hỗ trợ.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {providers.map((provider) => {
                            const enabled =
                                form.providers[provider.key]?.enabled ?? false;

                            return (
                                <div
                                    key={provider.key}
                                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white p-1">
                                            {provider.logo ? (
                                                <img
                                                    src={provider.logo}
                                                    alt={provider.name}
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : (
                                                <Landmark
                                                    size={20}
                                                    className="text-teal-600"
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800">
                                                {provider.name}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {provider.description}
                                            </p>
                                        </div>
                                    </div>

                                    <Toggle
                                        enabled={enabled}
                                        label={provider.name}
                                        onToggle={() =>
                                            handleProviderChange(provider.key)
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Ví điện tử */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Wallet size={20} />
                            Ví điện tử (VTicket Wallet)
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <ShieldCheck size={21} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        Cho phép sử dụng ví điện tử
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Tắt ví điện tử sẽ ẩn toàn bộ chức năng
                                        nạp tiền và thanh toán bằng số dư ví.
                                    </p>
                                </div>
                            </div>

                            <Toggle
                                enabled={Boolean(form.wallet.enabled)}
                                label="Cho phép sử dụng ví điện tử"
                                onToggle={() =>
                                    handleWalletChange(
                                        "enabled",
                                        !form.wallet.enabled
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <CreditCard size={21} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        Thanh toán mua vé bán lại bằng ví
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Cho phép người mua trở tiền trực tiếp từ
                                        số dư ví khi mua vé bán lại.
                                    </p>
                                </div>
                            </div>

                            <Toggle
                                enabled={Boolean(
                                    form.wallet.allowWalletPayment
                                )}
                                label="Thanh toán mua vé bán lại bằng ví"
                                onToggle={() =>
                                    handleWalletChange(
                                        "allowWalletPayment",
                                        !form.wallet.allowWalletPayment
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                    <ArrowUpRight size={21} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        Cho phép rút tiền về tài khoản
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Cho phép cả 3 vai trò rút tiền từ ví về
                                        tài khoản ngân hàng hoặc ví điện tử đã
                                        liên kết.
                                    </p>
                                </div>
                            </div>

                            <Toggle
                                enabled={Boolean(form.wallet.allowWithdraw)}
                                label="Cho phép rút tiền"
                                onToggle={() =>
                                    handleWalletChange(
                                        "allowWithdraw",
                                        !form.wallet.allowWithdraw
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-5 grid gap-5 border-t border-gray-100 pt-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="minTopUp"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Số tiền nạp tối thiểu (đ)
                            </label>
                            <input
                                id="minTopUp"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.wallet.minTopUp}
                                onChange={(e) =>
                                    handleWalletChange(
                                        "minTopUp",
                                        e.target.value
                                    )
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="maxTopUp"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Số tiền nạp tối đa (đ)
                            </label>
                            <input
                                id="maxTopUp"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.wallet.maxTopUp}
                                onChange={(e) =>
                                    handleWalletChange(
                                        "maxTopUp",
                                        e.target.value
                                    )
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Hạn mức rút tiền */}
                    <div className="mt-5 grid gap-5 border-t border-gray-100 pt-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="minWithdraw"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Số tiền rút tối thiểu (đ)
                            </label>
                            <input
                                id="minWithdraw"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.wallet.minWithdraw}
                                onChange={(e) =>
                                    handleWalletChange(
                                        "minWithdraw",
                                        e.target.value
                                    )
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="maxWithdraw"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Số tiền rút tối đa (đ)
                            </label>
                            <input
                                id="maxWithdraw"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.wallet.maxWithdraw}
                                onChange={(e) =>
                                    handleWalletChange(
                                        "maxWithdraw",
                                        e.target.value
                                    )
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Vai trò được phép dùng ví */}
                    <div className="mt-5 border-t border-gray-100 pt-5">
                        <p className="mb-1 text-sm font-medium text-gray-700">
                            Vai trò được phép sử dụng ví
                        </p>
                        <p className="mb-3 text-sm text-gray-500">
                            Chọn những vai trò được phép nạp tiền, thanh toán và
                            rút tiền trên ví điện tử.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { value: "USER", label: "Khách hàng" },
                                { value: "ORGANIZER", label: "Ban tổ chức" },
                                { value: "ADMIN", label: "Quản trị" },
                            ].map((role) => {
                                const checked =
                                    form.wallet.allowedRoles?.includes(
                                        role.value
                                    ) ?? false;

                                return (
                                    <label
                                        key={role.value}
                                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium transition ${
                                            checked
                                                ? "border-blue-500 bg-blue-50/60 text-blue-700"
                                                : "border-gray-200 text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) =>
                                                handleWalletRoleToggle(
                                                    role.value,
                                                    e.target.checked
                                                )
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {role.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </section>

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

                    <Button type="submit" variant="primary" disabled={saving}>
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

export default PaymentSetting;

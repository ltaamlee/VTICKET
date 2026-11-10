
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
        momo: { enabled: true },
        vnpay: { enabled: true },
        payos: { enabled: false },
    },
};

const providers = [
    {
        key: "momo",
        name: "MoMo",
        description: "Thanh toán qua ví điện tử MoMo.",
        logo: "/images/payment/momo.png",
    },
    {
        key: "vnpay",
        name: "VNPay",
        description: "Thanh toán qua cổng VNPay và ngân hàng.",
        logo: "/images/payment/vnpay.png",
    },
    {
        key: "payos",
        name: "PayOS",
        description: "Thanh toán qua mã QR ngân hàng.",
        logo: "/images/payment/payos.png",
    },
];

function PaymentSetting({ onAlert }) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Tải cấu hình thanh toán
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
                    ...payment.providers,
                },
            });
        } catch (err) {
            setError(
                err.message || "Không thể tải cấu hình thanh toán."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Thay đổi tỷ lệ phí sàn
    const handleFeeChange = (e) => {
        const value = e.target.value;

        setForm((prev) => ({
            ...prev,
            platformFeeRate: value,
        }));

        setError("");
    };

    // Bật hoặc tắt phương thức thanh toán
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

    // Lưu cấu hình thanh toán
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        const feeRate = Number(form.platformFeeRate);

        if (
            form.platformFeeRate === "" ||
            !Number.isFinite(feeRate) ||
            feeRate < 0 ||
            feeRate > 100
        ) {
            setError("Tỷ lệ phí sàn phải nằm trong khoảng 0–100%.");
            return;
        }

        if (!Object.values(form.providers).some((item) => item.enabled)) {
            setError("Vui lòng bật ít nhất một phương thức thanh toán.");
            return;
        }

        try {
            setSaving(true);

            await updateSettings("payment", {
                platformFeeRate: feeRate,
                environment: form.environment,
                providers: form.providers,
            });

            onAlert?.({
                variant: "success",
                title: "Thành công",
                message: "Cập nhật cấu hình thanh toán thành công.",
                icon: CheckCircle,
            });
        } catch (err) {
            setError(
                err.message || "Không thể lưu cấu hình thanh toán."
            );
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

                {/* Tỷ lệ phí sàn */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Percent size={20} />
                            Phí giao dịch
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Thiết lập tỷ lệ phí mà nền tảng thu trên mỗi giao dịch.
                        </p>
                    </div>

                    <div className="max-w-md">
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
                                onChange={handleFeeChange}
                                placeholder="Nhập tỷ lệ phí sàn"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                %
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                            Giá trị cho phép từ 0% đến 100%. Mặc định là 2%.
                        </p>
                    </div>
                </section>

                {/* Môi trường thanh toán */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <ShieldCheck size={20} />
                            Môi trường thanh toán
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Chọn môi trường sử dụng cho các cổng thanh toán.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
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
                                    "Môi trường hoạt động và thanh toán thực tế.",
                            },
                        ].map((item) => (
                            <label
                                key={item.value}
                                className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${form.environment === item.value
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
                                    <p className="font-medium text-gray-800">
                                        {item.title}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {item.description}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Phương thức thanh toán */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Wallet size={20} />
                            Phương thức thanh toán
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
                                    className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white p-1">
                                            <img
                                                src={provider.logo}
                                                alt={provider.name}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {provider.name}
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {provider.description}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={enabled}
                                        onClick={() =>
                                            handleProviderChange(provider.key)
                                        }
                                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled
                                                ? "bg-blue-600"
                                                : "bg-gray-300"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Nút thao tác */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={loadSettings}
                        disabled={saving || loading}
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
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
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
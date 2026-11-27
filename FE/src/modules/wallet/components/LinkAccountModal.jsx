import { useEffect, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";

import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../components/common/form/FormPanel";
import CurrencyInput from "../../../components/common/form/CurrencyInput";
import { linkWalletAccount, topUpWallet } from "../services/walletService";

/**
 * LinkAccountModal - Modal liên kết tài khoản thanh toán (MoMo/VNPay/PayOS/ngân hàng)
 * vào ví điện tử, sau đó nạp tiền.
 */
export default function LinkAccountModal({
    isOpen,
    onClose,
    providers = [],
    settings = null,
    onSuccess,
}) {
    const [provider, setProvider] = useState("MOMO");
    const [identifier, setIdentifier] = useState("");
    const [nickname, setNickname] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState("form");
    const [amount, setAmount] = useState(0);
    const [createdAccount, setCreatedAccount] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        setProvider("MOMO");
        setIdentifier("");
        setNickname("");
        setIsDefault(false);
        setError("");
        setStep("form");
        setAmount(0);
        setCreatedAccount(null);
    }, [isOpen]);

    if (!isOpen) return null;

    const selectedProvider =
        providers.find((item) => item.provider === provider) || {
            provider: "MOMO",
            name: "MoMo",
            logo: null,
            color: "#2563EB",
        };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError("");

        if (!identifier.trim()) {
            setError("Vui lòng nhập số điện thoại hoặc email đã đăng ký.");
            return;
        }

        try {
            setLoading(true);

            const response = await linkWalletAccount({
                provider,
                identifier: identifier.trim(),
                nickname: nickname.trim() || null,
                isDefault,
            });

            setCreatedAccount(response.data);
            setStep("topup");
            onSuccess?.();
        } catch (err) {
            setError(err.message || "Không thể liên kết tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (e) => {
        e?.preventDefault();
        setError("");

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError("Vui lòng nhập số tiền nạp hợp lệ.");
            return;
        }

        const minTopUp = Number(settings?.minTopUp ?? 0);
        const maxTopUp = Number(settings?.maxTopUp ?? 100000000);

        if (numericAmount < minTopUp) {
            setError(
                `Số tiền nạp tối thiểu là ${minTopUp.toLocaleString("vi-VN")} đ.`
            );
            return;
        }

        if (numericAmount > maxTopUp) {
            setError(
                `Số tiền nạp tối đa là ${maxTopUp.toLocaleString("vi-VN")} đ.`
            );
            return;
        }

        try {
            setLoading(true);

            await topUpWallet({
                accountId: createdAccount.id,
                amount: numericAmount,
            });

            onSuccess?.();
            onClose?.();
        } catch (err) {
            setError(err.message || "Không thể nạp tiền vào ví.");
        } finally {
            setLoading(false);
        }
    };

    const isTopUpStep = step === "topup";

    return (
        <FormPanel
            icon={WalletIcon}
            title={
                isTopUpStep
                    ? "Nạp tiền vào ví"
                    : "Liên kết tài khoản thanh toán"
            }
            subtitle={
                isTopUpStep
                    ? `Nạp tiền từ ${selectedProvider.name} vào ví điện tử.`
                    : "Liên kết MoMo, VNPay, PayOS hoặc tài khoản ngân hàng của bạn."
            }
            onClose={onClose}
            onSubmit={isTopUpStep ? handleTopUp : handleSubmit}
            loading={loading}
            error={error}
            submitText={isTopUpStep ? "Nạp tiền" : "Liên kết tài khoản"}
            submitVariant={isTopUpStep ? "success" : "primary"}
        >
            {!isTopUpStep ? (
                <>
                    {/* Chọn nhà cung cấp */}
                    <div>
                        <label className={FORM_PANEL_LABEL_CLASS}>
                            Nhà cung cấp
                        </label>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {providers.map((item) => (
                                <button
                                    key={item.provider}
                                    type="button"
                                    onClick={() => setProvider(item.provider)}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                                        provider === item.provider
                                            ? "border-blue-500 bg-blue-50/70"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    {item.logo ? (
                                        <img
                                            src={item.logo}
                                            alt={item.name}
                                            className="h-6 w-6 rounded object-contain"
                                        />
                                    ) : (
                                        <span
                                            className="flex h-6 w-6 items-center justify-center rounded text-white"
                                            style={{
                                                backgroundColor:
                                                    item.color || "#2563EB",
                                            }}
                                        >
                                            <WalletIcon className="h-3.5 w-3.5" />
                                        </span>
                                    )}

                                    <span className="truncate text-xs font-semibold text-gray-800">
                                        {item.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Số điện thoại / email */}
                    <div>
                        <label className={FORM_PANEL_LABEL_CLASS}>
                            Số điện thoại / Email đăng ký
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) =>
                                setIdentifier(e.target.value)
                            }
                            placeholder="Ví dụ: 0901234567"
                            className={FORM_PANEL_INPUT_CLASS}
                        />
                    </div>

                    {/* Tên gọi */}
                    <div>
                        <label className={FORM_PANEL_LABEL_CLASS}>
                            Tên gọi (không bắt buộc)
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ví dụ: MoMo chính"
                            className={FORM_PANEL_INPUT_CLASS}
                        />
                    </div>

                    {/* Đặt mặc định */}
                    <label className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Đặt làm tài khoản thanh toán mặc định
                    </label>
                </>
            ) : (
                <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
                        Đã liên kết {selectedProvider.name} —{" "}
                        {createdAccount?.identifier}. Bạn có thể nạp tiền ngay.
                    </div>

                    <div>
                        <label className={FORM_PANEL_LABEL_CLASS}>
                            Số tiền nạp
                        </label>
                        <CurrencyInput
                            id="wallet-topup-amount"
                            value={amount}
                            onChange={setAmount}
                            disabled={loading}
                            placeholder="Nhập số tiền"
                            className={`${FORM_PANEL_INPUT_CLASS} pr-14`}
                        />
                        <p className="mt-1.5 text-xs text-gray-500">
                            Hạn mức nạp:{" "}
                            {Number(
                                settings?.minTopUp ?? 0
                            ).toLocaleString("vi-VN")}{" "}
                            –{" "}
                            {Number(
                                settings?.maxTopUp ?? 100000000
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                        </p>
                    </div>
                </>
            )}
        </FormPanel>
    );
}

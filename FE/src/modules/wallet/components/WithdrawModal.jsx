import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../components/common/form/FormPanel";
import CurrencyInput from "../../../components/common/form/CurrencyInput";
import { withdrawWallet } from "../services/walletService";

/**
 * WithdrawModal - Rút tiền từ ví điện tử về tài khoản đã liên kết.
 */
export default function WithdrawModal({
    isOpen,
    onClose,
    accounts = [],
    settings = null,
    availableBalance = 0,
    onSuccess,
}) {
    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState(0);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const defaultAccount =
            accounts.find((item) => item.isDefault) || accounts[0];

        setAccountId(defaultAccount?.id || "");
        setAmount(0);
        setNote("");
        setError("");
    }, [isOpen, accounts]);

    if (!isOpen) return null;

    const minWithdraw = Number(settings?.minWithdraw ?? 0);
    const maxWithdraw = Math.min(
        Number(settings?.maxWithdraw ?? 100000000),
        Number(availableBalance || 0)
    );

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError("");

        if (!accountId) {
            setError("Vui lòng chọn tài khoản nhận tiền.");
            return;
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError("Vui lòng nhập số tiền rút hợp lệ.");
            return;
        }

        if (numericAmount < minWithdraw) {
            setError(
                `Số tiền rút tối thiểu là ${minWithdraw.toLocaleString("vi-VN")} đ.`
            );
            return;
        }

        if (numericAmount > Number(availableBalance || 0)) {
            setError("Số dư khả dụng trong ví không đủ để rút.");
            return;
        }

        try {
            setLoading(true);

            await withdrawWallet({
                accountId,
                amount: numericAmount,
                note: note.trim() || undefined,
            });

            onSuccess?.();
            onClose?.();
        } catch (err) {
            setError(err.message || "Không thể gửi yêu cầu rút tiền.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormPanel
            icon={ArrowUpRight}
            title="Rút tiền"
            subtitle="Chuyển tiền từ ví điện tử về tài khoản đã liên kết."
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitText="Gửi yêu cầu rút tiền"
            submitVariant="primary"
        >
            {/* Số dư khả dụng */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Số dư khả dụng</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">
                    {Number(availableBalance || 0).toLocaleString("vi-VN")} đ
                </p>
            </div>

            {/* Tài khoản nhận tiền */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Tài khoản nhận tiền
                </label>

                {accounts.length === 0 ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                        Bạn chưa có tài khoản liên kết. Vui lòng liên kết tài
                        khoản ngân hàng hoặc ví điện tử trước khi rút tiền.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {accounts.map((account) => (
                            <label
                                key={account.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                                    accountId === account.id
                                        ? "border-blue-500 bg-blue-50/60"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="withdraw-account"
                                    value={account.id}
                                    checked={accountId === account.id}
                                    onChange={(e) =>
                                        setAccountId(e.target.value)
                                    }
                                    className="h-4 w-4 accent-blue-600"
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {account.nickname ||
                                            account.providerName}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {account.providerName} ·{" "}
                                        {account.identifier}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Số tiền rút */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Số tiền rút
                </label>
                <CurrencyInput
                    id="wallet-withdraw-amount"
                    value={amount}
                    onChange={setAmount}
                    disabled={loading}
                    placeholder="Nhập số tiền"
                    className={`${FORM_PANEL_INPUT_CLASS} pr-14`}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                    Hạn mức rút:{" "}
                    {minWithdraw.toLocaleString("vi-VN")} –{" "}
                    {maxWithdraw.toLocaleString("vi-VN")} đ
                </p>
            </div>

            {/* Ghi chú */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Ghi chú (không bắt buộc)
                </label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Rút tiền cuối tháng"
                    className={FORM_PANEL_INPUT_CLASS}
                />
            </div>
        </FormPanel>
    );
}

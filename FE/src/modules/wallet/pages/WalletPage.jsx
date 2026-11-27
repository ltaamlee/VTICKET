import { useCallback, useEffect, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    LoaderCircle,
    Plus,
    RefreshCw,
    Star,
    Trash2,
    Wallet as WalletIcon,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import LinkAccountModal from "../components/LinkAccountModal";
import WithdrawModal from "../components/WithdrawModal";
import {
    getWalletOverview,
    listWalletProviders,
    setDefaultWalletAccount,
    unlinkWalletAccount,
} from "../services/walletService";

const TYPE_META = {
    TOPUP: {
        label: "Nạp tiền",
        icon: ArrowDownLeft,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    PAYMENT: {
        label: "Thanh toán",
        icon: ArrowUpRight,
        className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    REFUND: {
        label: "Hoàn tiền",
        icon: RefreshCw,
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    WITHDRAW: {
        label: "Rút tiền",
        icon: ArrowUpRight,
        className: "bg-rose-50 text-rose-700 border-rose-200",
    },
};

const STATUS_META = {
    PENDING: {
        label: "Đang xử lý",
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    SUCCESS: {
        label: "Thành công",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    FAILED: {
        label: "Thất bại",
        className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    REVERSED: {
        label: "Đã hoàn tác",
        className: "bg-slate-100 text-slate-600 border-slate-200",
    },
};

function money(amount) {
    return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

/**
 * WalletPage - Trang ví điện tử của khách hàng.
 *
 * Hiển thị số dư, các tài khoản thanh toán liên kết (MoMo, VNPay, PayOS,
 * ngân hàng) và lịch sử giao dịch.
 */
export default function WalletPage() {
    const [wallet, setWallet] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [providers, setProviders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [settings, setSettings] = useState(null);

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [linkOpen, setLinkOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);

    const loadData = useCallback(
        async (targetPage = 1) => {
            try {
                setLoading(true);
                setError("");

                const response = await getWalletOverview({
                    page: targetPage,
                    pageSize: 10,
                });

                const data = response?.data ?? {};

                setWallet(data.wallet ?? null);
                setSettings(data.settings ?? null);
                setAccounts(data.accounts ?? []);
                setTransactions(data.transactions ?? []);
                setPagination(data.pagination ?? null);
            } catch (err) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Không thể tải thông tin ví điện tử."
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        loadData(page);
    }, [loadData, page]);

    useEffect(() => {
        listWalletProviders()
            .then((response) => {
                const data = response?.data ?? [];
                setProviders(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                // Danh sách nhà cung cấp là tuỳ chọn
            });
    }, []);

    const handleSetDefault = async (accountId) => {
        try {
            await setDefaultWalletAccount(accountId);
            await loadData(page);
        } catch (err) {
            setError(err.message || "Không thể đặt tài khoản mặc định.");
        }
    };

    const handleUnlink = async (accountId) => {
        try {
            await unlinkWalletAccount(accountId);
            await loadData(page);
        } catch (err) {
            setError(err.message || "Không thể gỡ liên kết tài khoản.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Ví điện tử
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý số dư, tài khoản thanh toán liên kết và lịch sử
                        giao dịch của bạn.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setWithdrawOpen(true)}
                        disabled={accounts.length === 0}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                        Rút tiền
                    </button>

                    <button
                        type="button"
                        onClick={() => setLinkOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Liên kết tài khoản / Nạp tiền
                    </button>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                >
                    {error}
                </div>
            )}

            {/* Số dư */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <WalletIcon className="h-4 w-4 text-gray-500" />
                        <h2 className="text-base font-bold text-gray-900">
                            Số dư ví
                        </h2>
                    </div>
                </div>

                <div className="px-6 py-6">
                    {loading ? (
                        <div className="h-10 w-56 animate-pulse rounded-lg bg-gray-100" />
                    ) : (
                        <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                            {money(wallet?.availableBalance ?? 0)}
                        </p>
                    )}

                    <p className="mt-1.5 text-xs text-gray-500">
                        Số dư khả dụng để thanh toán vé bán lại và rút tiền về
                        tài khoản đã liên kết.
                    </p>

                    <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs text-gray-500">
                                Tổng số dư
                            </dt>
                            <dd className="mt-0.5 text-sm font-bold text-gray-900">
                                {money(wallet?.balance ?? 0)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-500">
                                Đang bị giữ
                            </dt>
                            <dd className="mt-0.5 text-sm font-bold text-gray-900">
                                {money(wallet?.frozenAmount ?? 0)}
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            {/* Tài khoản liên kết */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-b border-gray-100 pb-3 text-base font-bold text-gray-900">
                    Tài khoản thanh toán liên kết
                </h2>

                {accounts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
                        <p className="text-sm font-medium text-gray-500">
                            Bạn chưa liên kết tài khoản thanh toán nào.
                        </p>
                        <button
                            type="button"
                            onClick={() => setLinkOpen(true)}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Liên kết ngay
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3.5"
                            >
                                {account.providerLogo ? (
                                    <img
                                        src={account.providerLogo}
                                        alt={account.providerName}
                                        className="h-9 w-9 rounded-lg object-contain"
                                    />
                                ) : (
                                    <span
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                                        style={{
                                            backgroundColor:
                                                account.providerColor ||
                                                "#2563EB",
                                        }}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                    </span>
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                        {account.nickname ||
                                            account.providerName}
                                        {account.isDefault && (
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        )}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {account.providerName} ·{" "}
                                        {account.identifier}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    {!account.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSetDefault(account.id)
                                            }
                                            title="Đặt làm mặc định"
                                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-amber-500"
                                        >
                                            <Star className="h-4 w-4" />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleUnlink(account.id)
                                        }
                                        title="Gỡ liên kết"
                                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Lịch sử giao dịch */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-b border-gray-100 pb-3 text-base font-bold text-gray-900">
                    Lịch sử giao dịch
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Đang tải...
                    </div>
                ) : transactions.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">
                        Chưa có giao dịch nào trên ví.
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((tx) => {
                            const typeMeta =
                                TYPE_META[tx.type] || TYPE_META.PAYMENT;
                            const statusMeta =
                                STATUS_META[tx.status] ||
                                STATUS_META.PENDING;
                            const Icon = typeMeta.icon;
                            const isCredit =
                                tx.type === "TOPUP" || tx.type === "REFUND";

                            return (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-3 py-3.5"
                                >
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeMeta.className}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {tx.description ||
                                                typeMeta.label}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {new Date(
                                                tx.createdAt
                                            ).toLocaleString("vi-VN")}{" "}
                                            ·{" "}
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}
                                            >
                                                {statusMeta.label}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p
                                            className={`text-sm font-bold ${
                                                isCredit
                                                    ? "text-emerald-600"
                                                    : "text-gray-900"
                                            }`}
                                        >
                                            {isCredit ? "+" : "-"}
                                            {money(tx.amount)}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-gray-400">
                                            Còn {money(tx.balanceAfter)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-4 flex justify-center border-t border-gray-100 pt-4">
                        <Pagination
                            page={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={(next) => setPage(next)}
                        />
                    </div>
                )}
            </section>

            <LinkAccountModal
                isOpen={linkOpen}
                onClose={() => setLinkOpen(false)}
                providers={providers}
                settings={settings}
                onSuccess={() => loadData(page)}
            />

            <WithdrawModal
                isOpen={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                accounts={accounts}
                settings={settings}
                availableBalance={wallet?.availableBalance ?? 0}
                onSuccess={() => loadData(page)}
            />
        </div>
    );
}

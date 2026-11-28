import { useEffect, useState } from "react";
import {
    Bell,
    Mail,
    RefreshCw,
    Save,
    LoaderCircle,
    CheckCircle,
    Info,
} from "lucide-react";

import Button from "../../../components/common/button/Button";

import {
    getSettings,
    updateSettings,
} from "../services/systemService";

import {
    DEFAULT_NOTIFICATION_FORM,
    NOTIFICATION_CHANNELS,
} from "../../notification/constants/notificationConstants";

/**
 * Admin > Quản lý hệ thống > Thông báo.
 *
 * CHỈ quản lý phần CƠ BẢN: các kênh gửi thông báo.
 * Không có danh mục bật/tắt theo loại thông báo - mọi thông báo đều được
 * tạo và đẩy realtime ngay lập tức khi phát sinh.
 */
function Notification({ onAlert }) {
    const [form, setForm] = useState(DEFAULT_NOTIFICATION_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Tải cấu hình thông báo
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getSettings();
            const settings = response?.data ?? response;
            const notification = settings?.notification ?? {};

            setForm({
                channels: {
                    ...DEFAULT_NOTIFICATION_FORM.channels,
                    ...notification.channels,
                },
            });
        } catch (err) {
            setError(err.message || "Không thể tải cấu hình thông báo.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Bật hoặc tắt kênh
    const handleChange = (group, key) => {
        setForm((prev) => ({
            ...prev,
            [group]: {
                ...prev[group],
                [key]: !prev[group][key],
            },
        }));

        setError("");
    };

    // Lưu cấu hình
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        if (!Object.values(form.channels).some(Boolean)) {
            setError("Vui lòng bật ít nhất một kênh thông báo.");
            return;
        }

        try {
            setSaving(true);

            await updateSettings("notification", form);

            onAlert?.({
                variant: "success",
                title: "Thành công",
                message:
                    "Cập nhật cấu hình thông báo thành công. Thay đổi đã có hiệu lực ngay.",
                icon: CheckCircle,
            });
        } catch (err) {
            setError(err.message || "Không thể lưu cấu hình thông báo.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-500">
                <LoaderCircle size={22} className="mr-2 animate-spin" />
                Đang tải cấu hình thông báo...
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
                {/* Kênh thông báo */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Bell size={20} />
                            Kênh thông báo
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Quản lý các kênh gửi thông báo đến người dùng.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {NOTIFICATION_CHANNELS.map((item) => {
                            const Icon = item.icon === "Mail" ? Mail : Bell;

                            return (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between gap-4 py-5"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <Icon size={21} />
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {item.name}
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.channels[item.key]}
                                        onClick={() =>
                                            handleChange("channels", item.key)
                                        }
                                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.channels[item.key]
                                            ? "bg-blue-600"
                                            : "bg-gray-300"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${form.channels[item.key]
                                                ? "left-6"
                                                : "left-1"
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

export default Notification;

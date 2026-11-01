
import { useEffect, useRef, useState } from "react";
import {
    RotateCcw,
    Image,
    Mail,
    Type,
    LoaderCircle,
    List,
    Upload,
    UserRound,
    CheckCircle,
    Sun,
    Moon,
    Monitor,
    Palette,
} from "lucide-react";

import Button from "../../../../components/common/button/Button";

import {
    getSettings,
    updateSettings,
} from "../../../admin/services/systemService";

const initialForm = {
    title: "VTicket",
    logoUrl: "",
    supportEmail: "",
    theme: "light",
    primaryColor: "#2563EB",
    defaultPageSize: 10,
};

const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const themes = [
    {
        value: "light",
        label: "Sáng",
        description: "Giao diện nền sáng.",
        icon: Sun,
    },
    {
        value: "dark",
        label: "Tối",
        description: "Giao diện nền tối.",
        icon: Moon,
    },
    {
        value: "system",
        label: "Theo hệ thống",
        description: "Tự động theo thiết bị người dùng.",
        icon: Monitor,
    },
];

function General({ onAlert }) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const logoInputRef = useRef(null);

    // Tải cấu hình hệ thống
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getSettings();
            const settings = response?.data ?? response;

            const general = settings?.general ?? {};
            const appearance = settings?.appearance ?? {};

            setForm({
                ...initialForm,
                ...appearance,
                ...general,
                theme: general.theme ?? appearance.theme ?? initialForm.theme,
                primaryColor:
                    general.primaryColor ??
                    appearance.primaryColor ??
                    initialForm.primaryColor,
            });
        } catch (err) {
            setError(
                err.message || "Không thể tải cấu hình hệ thống."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // Tải logo từ máy tính
    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Vui lòng chọn ảnh JPG, PNG, GIF hoặc WEBP.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Dung lượng logo tối đa là 5 MB.");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            setForm((prev) => ({
                ...prev,
                logoUrl: String(reader.result || ""),
            }));

            setError("");
        };

        reader.onerror = () => {
            setError("Không thể đọc tệp ảnh đã chọn.");
        };

        reader.readAsDataURL(file);
    };

    // Đặt lại logo
    const handleResetLogo = () => {
        setForm((prev) => ({
            ...prev,
            logoUrl: "",
        }));

        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }

        setError("");
    };

    // Thay đổi dữ liệu
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
    };

    // Lưu cấu hình
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        const title = form.title.trim();
        const logoUrl = form.logoUrl.trim();
        const supportEmail = form.supportEmail.trim();
        const primaryColor = form.primaryColor.trim();
        const defaultPageSize = Number(form.defaultPageSize);

        if (!title) {
            setError("Tên website không được để trống.");
            return;
        }

        const isValidLogo =
            /^https?:\/\/.+/i.test(logoUrl) ||
            /^data:image\/(png|jpeg|gif|webp);base64,/i.test(logoUrl);

        if (logoUrl && !isValidLogo) {
            setError("Logo phải là đường dẫn ảnh hợp lệ hoặc ảnh được tải lên.");
            return;
        }

        if (
            supportEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)
        ) {
            setError("Email hỗ trợ không hợp lệ.");
            return;
        }

        if (!["light", "dark", "system"].includes(form.theme)) {
            setError("Chế độ giao diện không hợp lệ.");
            return;
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
            setError("Mã màu chủ đạo không hợp lệ.");
            return;
        }

        if (
            form.defaultPageSize === "" ||
            !Number.isInteger(defaultPageSize) ||
            defaultPageSize < 1 ||
            defaultPageSize > 100
        ) {
            setError("Số dòng mỗi trang phải từ 1 đến 100.");
            return;
        }

        try {
            setSaving(true);

            await updateSettings("general", {
                title,
                logoUrl,
                supportEmail,
                theme: form.theme,
                primaryColor,
                defaultPageSize,
            });

            onAlert?.({
                variant: "success",
                title: "Thành công",
                message: "Cập nhật cấu hình chung thành công.",
                icon: CheckCircle,
            });
        } catch (err) {
            setError(err.message || "Không thể lưu cấu hình.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-500">
                <LoaderCircle size={22} className="mr-2 animate-spin" />
                Đang tải cấu hình...
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

                {/* THÔNG TIN WEBSITE */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Thông tin website
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Quản lý tên và logo nhận diện của VTICKET.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">

                        {/* Tên website */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Type size={16} />
                                Tên website
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Nhập tên website"
                                maxLength={100}
                                required
                                className={inputClass}
                            />
                        </div>

                        {/* Logo */}
                        <div>
                            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Image size={16} />
                                Logo website
                            </label>

                            <div className="flex flex-col items-center rounded-lg border border-gray-200 px-4 py-6">
                                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-blue-50">
                                    {form.logoUrl ? (
                                        <img
                                            src={form.logoUrl}
                                            alt="Logo website"
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <UserRound
                                            size={64}
                                            className="text-blue-300"
                                        />
                                    )}
                                </div>

                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />

                                <div className="mt-5 flex flex-wrap justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            logoInputRef.current?.click()
                                        }
                                        className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                                    >
                                        <Upload size={16} />
                                        Tải ảnh lên
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleResetLogo}
                                        className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                                    >
                                        <RotateCcw size={16} />
                                        Đặt lại
                                    </button>
                                </div>

                                <p className="mt-4 text-center text-xs text-gray-500">
                                    JPG, PNG, GIF hoặc WEBP. Tối đa 5 MB.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THÔNG TIN LIÊN HỆ */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Thông tin liên hệ
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Cấu hình địa chỉ email hỗ trợ người dùng.
                        </p>
                    </div>

                    <div className="max-w-xl">
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Mail size={16} />
                            Email hỗ trợ
                        </label>

                        <input
                            type="email"
                            name="supportEmail"
                            value={form.supportEmail}
                            onChange={handleChange}
                            placeholder="support@vticket.com"
                            className={inputClass}
                        />
                    </div>
                </section>

                {/* GIAO DIỆN WEBSITE */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Palette size={20} />
                            Giao diện website
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Tùy chỉnh chủ đề và màu sắc nhận diện của VTICKET.
                        </p>
                    </div>

                    {/* Chế độ giao diện */}
                    <div className="mb-6">
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                            Chế độ giao diện
                        </label>

                        <div className="grid gap-4 md:grid-cols-3">
                            {themes.map((item) => {
                                const Icon = item.icon;
                                const selected = form.theme === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                theme: item.value,
                                            }))
                                        }
                                        className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${selected
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <Icon
                                            size={21}
                                            className={
                                                selected
                                                    ? "text-blue-600"
                                                    : "text-gray-500"
                                            }
                                        />

                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {item.label}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {item.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Màu chủ đạo */}
                    <div className="max-w-xl">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Màu chủ đạo
                        </label>

                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.primaryColor}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        primaryColor: e.target.value,
                                    }))
                                }
                                className="h-11 w-14 cursor-pointer rounded-lg border border-gray-300 p-1"
                            />

                            <input
                                type="text"
                                name="primaryColor"
                                value={form.primaryColor}
                                onChange={handleChange}
                                maxLength={7}
                                placeholder="#2563EB"
                                className={inputClass}
                            />
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                            Chọn màu hoặc nhập mã HEX, ví dụ #2563EB.
                        </p>
                    </div>
                </section>

                {/* PHÂN TRANG */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <List size={20} />
                            Cấu hình phân trang
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Thiết lập số lượng bản ghi mặc định trên mỗi trang.
                        </p>
                    </div>

                    <div className="max-w-xs">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Số dòng mỗi trang
                        </label>

                        <input
                            type="number"
                            name="defaultPageSize"
                            value={form.defaultPageSize}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            step="1"
                            required
                            className={inputClass}
                        />
                    </div>
                </section>

                {/* NÚT THAO TÁC */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={loadSettings}
                        disabled={saving}
                    >
                        <RotateCcw size={16} />
                        Tải lại
                    </Button>

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
                        ) : null}

                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default General;
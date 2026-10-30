import { useEffect, useRef, useState } from "react";
import {
    Save,
    RotateCcw,
    Image,
    Mail,
    Type,
    LoaderCircle,
    Percent,
    List,
    Upload,
    UserRound,
    CheckCircle,
    XCircle
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
    platformFeeRate: 2,
    defaultPageSize: 10,
};

const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function General({ onAlert }) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const logoInputRef = useRef(null);

    // Tải cấu hình hệ thống
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const response = await getSettings();
            const settings = response?.data ?? response;
            const general = settings?.general ?? settings;

            setForm({
                ...initialForm,
                ...general,
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

    // Tải ảnh logo từ máy tính
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
            setError(
                "Vui lòng chọn ảnh JPG, PNG, GIF hoặc WEBP."
            );
            e.target.value = "";
            return;
        }

        if (file.size > 5000 * 1024) {
            setError("Dung lượng logo tối đa là 800 KB.");
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
            setSuccess("");
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
        setSuccess("");
    };

    // Xử lý thay đổi dữ liệu
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    // Lưu cấu hình
    const handleSave = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const title = form.title.trim();
        const logoUrl = form.logoUrl.trim();
        const supportEmail = form.supportEmail.trim();
        const platformFeeRate = Number(form.platformFeeRate);
        const defaultPageSize = Number(form.defaultPageSize);

        if (!title) {
            setError("Tên website không được để trống.");
            return;
        }

        // Cho phép URL hoặc ảnh được tải lên dưới dạng Data URL
        const isValidLogo =
            /^https?:\/\/.+/i.test(logoUrl) ||
            /^data:image\/(png|jpeg|gif|webp);base64,/i.test(
                logoUrl
            );

        if (logoUrl && !isValidLogo) {
            setError(
                "Logo phải là đường dẫn ảnh hợp lệ hoặc ảnh được tải lên."
            );
            return;
        }

        if (
            supportEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)
        ) {
            setError("Email hỗ trợ không hợp lệ.");
            return;
        }

        if (
            form.platformFeeRate === "" ||
            !Number.isFinite(platformFeeRate) ||
            platformFeeRate < 0 ||
            platformFeeRate > 100
        ) {
            setError(
                "Phí nền tảng phải nằm trong khoảng 0–100%."
            );
            return;
        }

        if (
            form.defaultPageSize === "" ||
            !Number.isInteger(defaultPageSize) ||
            defaultPageSize < 1 ||
            defaultPageSize > 100
        ) {
            setError(
                "Số dòng mỗi trang phải là số nguyên từ 1 đến 100."
            );
            return;
        }

        try {
            setSaving(true);

            await updateSettings("general", {
                title,
                logoUrl,
                supportEmail,
                platformFeeRate,
                defaultPageSize,
            });

            onAlert?.({
                variant: "success",
                title: "Thành công",
                message: "Cập nhật cấu hình thành công.",
                icon: "success" ? CheckCircle : XCircle,

            });

        } catch (err) {
            setError(
                err.message || "Không thể lưu cấu hình."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-500">
                <LoaderCircle
                    size={22}
                    className="mr-2 animate-spin"
                />
                Đang tải cấu hình...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Thông báo */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Hai khung nằm cạnh nhau */}
                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Website
                            </h3>
                        </div>

                        <div className="space-y-5">
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

                            {/* Logo hình tròn */}
                            <div>
                                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Image size={16} />
                                    Logo website
                                </label>

                                <div className="flex flex-col items-center rounded-lg border border-gray-100 px-4 py-6">
                                    {/* Ảnh xem trước */}
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

                                    {/* Input chọn ảnh */}
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />

                                    <div className="mt-5 flex items-center justify-center gap-3">
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
                                            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-pink-600"
                                        >
                                            <RotateCcw size={16} />
                                            Đặt lại
                                        </button>
                                    </div>

                                    <p className="mt-4 text-center text-sm text-gray-500">
                                        Chấp nhận JPG, GIF, PNG hoặc WEBP.
                                        <br />
                                        Dung lượng tối đa 5MB.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* KHUNG 2: CẤU HÌNH EMAIL */}
                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Email Support
                            </h3>
                        </div>

                        <div>
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

                        <div className="mb-6 border-b border-gray-100 pb-4">
                        </div>
                        
                        <div className="grid gap-5 md:grid-cols-2">
                            {/* Phí nền tảng */}
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Percent size={16} />
                                    Phí nền tảng (%)
                                </label>

                                <input
                                    type="number"
                                    name="platformFeeRate"
                                    value={form.platformFeeRate}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            {/* Số dòng mỗi trang */}
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <List size={16} />
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
                        </div>
                    </section>
                </div>



                {/* NÚT THAO TÁC */}
                <div className="flex flex-wrap justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={loadSettings}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RotateCcw size={16} />
                        Tải lại
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default General;
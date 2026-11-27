import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Lock } from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";
import {
    getProfile,
    updateProfile,
    changePassword,
} from "../services/profileService";
import Tabs from "../../../components/common/Tabs";
import PersonalInfoTab from "../components/PersonalInfoTab";
import SecurityTab from "../components/SecurityTab";
import ChangePasswordModal from "../components/ChangePasswordModal";

const tabs = [
    { id: "info", label: "Thông tin cá nhân", icon: User },
    { id: "security", label: "Tài khoản & bảo mật", icon: Lock },
];

function ProfilePage() {
    const { user: authUser, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") === "security" ? "security" : "info";

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");

    // Change password states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");
    const [pwdSuccess, setPwdSuccess] = useState("");

    const handleOpenPasswordModal = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPwdError("");
        setPwdSuccess("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setShowPasswordModal(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdError("");
        setPwdSuccess("");

        if (!currentPassword) {
            setPwdError("Vui lòng nhập mật khẩu hiện tại");
            return;
        }

        if (!newPassword) {
            setPwdError("Vui lòng nhập mật khẩu mới");
            return;
        }

        if (newPassword.length < 8) {
            setPwdError("Mật khẩu mới phải có tối thiểu 8 ký tự");
            return;
        }

        if (!/[A-Z]/.test(newPassword)) {
            setPwdError("Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa (A-Z)");
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            setPwdError("Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9)");
            return;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            setPwdError("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)");
            return;
        }

        if (currentPassword === newPassword) {
            setPwdError("Mật khẩu mới không được trùng với mật khẩu hiện tại");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPwdError("Mật khẩu xác nhận không khớp");
            return;
        }

        setPwdLoading(true);
        try {
            await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setPwdSuccess("Đổi mật khẩu thành công!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                setShowPasswordModal(false);
                setPwdSuccess("");
            }, 2000);
        } catch (err) {
            setPwdError(
                err.message ||
                    "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại"
            );
        } finally {
            setPwdLoading(false);
        }
    };

    // Tải dữ liệu hồ sơ từ API
    useEffect(() => {
        let cancelled = false;

        async function fetchProfileData() {
            try {
                setLoading(true);
                setError("");

                const response = await getProfile();
                const data = response.data;

                if (cancelled) return;

                setProfile(data);
                setFullName(data.fullName || "");
                setPhone(data.phone || "");
                setDob(data.dob ? data.dob.split("T")[0] : "");

                // Đồng bộ avatar vào AuthContext nếu chưa đồng bộ
                if (data.avatar && data.avatar !== authUser?.avatar) {
                    updateUser({ avatar: data.avatar });
                }
            } catch (err) {
                if (cancelled) return;

                setError(err.message || "Không thể tải thông tin hồ sơ.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchProfileData();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResetForm = () => {
        if (!profile) return;
        setFullName(profile.fullName || "");
        setPhone(profile.phone || "");
        setDob(profile.dob ? profile.dob.split("T")[0] : "");
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!fullName.trim() || fullName.trim().length < 2) {
            setError("Họ và tên phải có tối thiểu 2 ký tự");
            return;
        }

        if (phone.trim()) {
            const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(phone.trim())) {
                setError("Số điện thoại không đúng định dạng (VD: 0987654321)");
                return;
            }
        }

        setSaving(true);
        try {
            const response = await updateProfile({
                fullName: fullName.trim(),
                phone: phone.trim() || null,
                dob: dob || null,
            });

            const updated = response.data;
            setProfile(updated);
            setSuccess("Cập nhật thông tin cá nhân thành công!");

            // Đồng bộ vào AuthContext để cập nhật Header ngay lập tức
            updateUser({
                fullName: updated.fullName,
                avatar: updated.avatar,
                phone: updated.phone,
            });

            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            setError(err.message || "Cập nhật thất bại. Vui lòng thử lại");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tiêu đề trang */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Hồ sơ cá nhân
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Quản lý thông tin và bảo mật tài khoản VTICKET của bạn.
                </p>
            </div>

            {/* Tabs */}
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id) =>
                    setSearchParams(
                        id === "info" ? {} : { tab: id },
                        { replace: true }
                    )
                }
            />

            {/* Thông báo trạng thái */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === "info" && (
                <PersonalInfoTab
                    loading={loading}
                    profile={profile}
                    fullName={fullName}
                    setFullName={setFullName}
                    phone={phone}
                    setPhone={setPhone}
                    dob={dob}
                    setDob={setDob}
                    saving={saving}
                    handleSubmit={handleSubmit}
                    handleResetForm={handleResetForm}
                />
            )}

            {/* TAB 2: TÀI KHOẢN & BẢO MẬT */}
            {activeTab === "security" && (
                <SecurityTab
                    profile={profile}
                    handleOpenPasswordModal={handleOpenPasswordModal}
                />
            )}

            {/* MODAL ĐỔI MẬT KHẨU */}
            <ChangePasswordModal
                show={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                pwdError={pwdError}
                setPwdError={setPwdError}
                pwdSuccess={pwdSuccess}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showCurrentPassword={showCurrentPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                pwdLoading={pwdLoading}
                handleChangePassword={handleChangePassword}
            />
        </div>
    );
}

export default ProfilePage;

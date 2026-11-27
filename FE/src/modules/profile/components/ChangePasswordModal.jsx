import { Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../components/common/form/FormPanel";

export default function ChangePasswordModal({
    show,
    onClose,
    pwdError,
    setPwdError,
    pwdSuccess,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    pwdLoading,
    handleChangePassword,
}) {
    if (!show) return null;

    return (
        <FormPanel
            icon={Lock}
            title="Đổi mật khẩu"
            subtitle="Nhập mật khẩu hiện tại và mật khẩu mới cho tài khoản của bạn."
            onClose={onClose}
            onSubmit={handleChangePassword}
            loading={pwdLoading}
            error={pwdError}
            size="sm"
            submitText="Cập nhật mật khẩu"
        >
            {pwdSuccess && (
                <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{pwdSuccess}</span>
                </p>
            )}

            {/* Mật khẩu hiện tại */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPwdError("");
                        }}
                        placeholder="Nhập mật khẩu hiện tại của bạn"
                        disabled={pwdLoading}
                        className={`${FORM_PANEL_INPUT_CLASS} pl-10 pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                        {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <KeyRound className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPwdError("");
                        }}
                        placeholder="Nhập mật khẩu mới"
                        disabled={pwdLoading}
                        className={`${FORM_PANEL_INPUT_CLASS} pl-10 pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                        {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <KeyRound className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPwdError("");
                        }}
                        placeholder="Nhập lại mật khẩu mới"
                        disabled={pwdLoading}
                        className={`${FORM_PANEL_INPUT_CLASS} pl-10 pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        </FormPanel>
    );
}

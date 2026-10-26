import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/authService";
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

function ForgotPasswordInput() {
  const navigate = useNavigate();

  // Step 1: Nhập email, Step 2: Nhập OTP & Mật khẩu mới
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Countdown timer for resend OTP
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Gửi OTP đến email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Định dạng email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess("Mã OTP đã được gửi đến email của bạn.");
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Gửi mã OTP thất bại. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setError("");
    setSuccess("");
    setResending(true);

    try {
      await forgotPassword(email.trim());
      setSuccess("Đã gửi lại mã OTP mới đến email của bạn.");
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Không thể gửi lại mã OTP");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Xác thực OTP và đặt lại mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP 6 số");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Mã OTP phải bao gồm 6 chữ số");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      setSuccess("Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {/* Thông báo thành công */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {step === 1 ? (
        /* ================= BƯỚC 1: NHẬP EMAIL ================= */
        <form onSubmit={handleSendEmail} noValidate className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quên mật khẩu</h2>
            <p className="mt-1 text-sm text-gray-500">
              Nhập email đăng ký tài khoản của bạn để nhận mã OTP đặt lại mật khẩu.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Địa chỉ Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="example@vticket.com"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? "Đang gửi mã..." : "Gửi mã xác thực"}
          </button>
        </form>
      ) : (
        /* ================= BƯỚC 2: NHẬP OTP VÀ MẬT KHẨU MỚI ================= */
        <form onSubmit={handleResetPassword} noValidate className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Đổi email
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Mã xác thực đã được gửi tới{" "}
              <strong className="text-gray-800">{email}</strong>
            </p>
          </div>

          {/* Ô nhập OTP */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Mã xác thực OTP (6 chữ số)
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || resending || loading}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {resending
                  ? "Đang gửi..."
                  : countdown > 0
                  ? `Gửi lại sau ${countdown}s`
                  : "Gửi lại OTP"}
              </button>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Ví dụ: 123456"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-center text-lg font-semibold tracking-widest outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? "Đang xử lý..." : "Lưu mật khẩu mới"}
          </button>
        </form>
      )}
    </div>
  );
}

export default ForgotPasswordInput;
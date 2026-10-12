import { Link , useLocation, useNavigate} from "react-router-dom";
import { useState } from "react";
import { verifyOtp, resendOtp } from "../services/authService";

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email){
      setError("Email không tồn tại trong hệ thống. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Mã OTP phải là mã bao gồm 6 chữ số.");
      setLoading(false);
      return;
    }

    try{
      await verifyOtp(email, otp);
      setSuccess("Xác thực OTP thành công! Bạn có thể đăng nhập ngay bây giờ.");

      setTimeout(() => {
        navigate("/login", {replace: true});
      }, 2000);
    } catch (error) {
      setError(error.message || "Xác thực OTP thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }
    const handleResendOtp = async () => {
      setError("");
      setSuccess("");
      setResendLoading(true);

      if (!email){
        setError("Email không tồn tại trong hệ thống. Vui lòng thử lại.");
        setResendLoading(false);
        return;
      }

      try{
        await resendOtp(email);
        setSuccess("Mã OTP đã được gửi lại. Vui lòng kiểm tra email của bạn.");
      } catch (error) {
        setError(error.message || "Gửi lại OTP thất bại. Vui lòng thử lại!");
      } finally {
        setResendLoading(false);
      }
       
  };

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-5">
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mã OTP
          </label>

          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            inputMode="numeric"
            placeholder="Nhập mã OTP"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Success */}
        {success && (
          <p className="mb-4 text-sm text-green-600">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          {loading ? "Đang xác thực..." : "Xác thực OTP"}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Chưa nhận được mã?{" "}
          <button
            type="submit"
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Gửi lại
          </button>
        </p>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </form>
  );
}

export default VerifyOtp;
import { Link } from "react-router-dom";
import { useState } from "react";

function VerifyOtp() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mã OTP
          </label>

          <input
            type="text"
            maxLength={6}
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
          type="button"
          className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Xác thực
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Chưa nhận được mã?{" "}
          <button
            type="button"
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
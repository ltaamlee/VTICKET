import { useState } from "react";
import { forgotPassword } from "../services/authService";

function ForgotPasswordInput() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Kiểm tra email rỗng
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }

    try {
      const result = await forgotPassword(email);

      console.log(result);
      setSuccess("Đã gửi mã OTP đến email của bạn");
    } catch (error) {
      console.error(error);
      setError(error.message || "Gửi mã OTP thất bại");
    }
  };

  return (
      <form
        onSubmit={handleSubmit}
        noValidate
      >
        <h1 className="mb-6 text-xl font-semibold">
          Nhập email của bạn để nhận mã xác thực
        </h1>

        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Nhập email của bạn"
          className="mb-1 w-full rounded-md border border-gray-300 px-4 py-2"
        />

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
          className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Gửi
        </button>
      </form>
  );
}

export default ForgotPasswordInput;
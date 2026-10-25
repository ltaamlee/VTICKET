import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { googleLogin } from "../services/authService";

function GoogleLoginButton() {
  const { login: saveLogin } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await googleLogin(credentialResponse.credential);

      // Điều chỉnh theo cấu trúc response thực tế của backend
      const data = response.data;
      saveLogin({
        token: data.token,
        user: data.user,
      });

      if (data.user.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (data.user.role === "ORGANIZER") {
        navigate("/organizer/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert(
        error.message ||
        error.response?.data?.message ||
        "Đăng nhập bằng Google thất bại."
      );
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => alert("Không thể đăng nhập bằng Google.")}
        text="continue_with"
        shape="rectangular"
        width="320"
        locale="vi"
      />
    </div>
  );
}

export default GoogleLoginButton;
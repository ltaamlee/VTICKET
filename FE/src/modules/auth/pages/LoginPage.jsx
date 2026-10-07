import LoginForm from "../components/LoginForm";
import { Link } from "react-router-dom";

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            VTICKET
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Muốn chiến thì tránh, hơi ngại chông gai!
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center text-sm text-gray-500">
          Bạn chưa có tài khoản?{" "}
          
          <Link
            to="/register"
            className="font-medium text-green-600 hover:text-green-700"
          >
            Đăng ký
          </Link>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
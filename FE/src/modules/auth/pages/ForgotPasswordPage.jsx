
import { Link } from "react-router-dom";
import ForgotPasswordInput from "../components/ForgotPasswordInput";

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            VTICKET
          </h1>
        </div>

        <ForgotPasswordInput />

        <div className="mt-6 text-center text-sm text-gray-500">          
          <Link
            to="/login"
            className="font-medium text-green-600 hover:text-green-700"
          >
            Quay lại đăng nhập
          </Link>
        </div>

      </div>
    </div>

  );
}

export default ForgotPasswordPage;
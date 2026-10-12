import { useLocation } from "react-router-dom";

import VerifyOtp from "../components/VerifyOtp";

function VerifyOtpPage() {
  const location = useLocation();
  const email = location.state?.email || "";
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">                <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            VTICKET
          </h1>
        </div>
      <VerifyOtp />
    </div>
    </div>
  );
}

export default VerifyOtpPage;
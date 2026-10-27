import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../modules/auth/pages/LoginPage";
import RegisterPage from "../modules/auth/pages/RegisterPage";
import ForgotPasswordPage from "../modules/auth/pages/ForgotPasswordPage";
import VerifyOtpPage from "../modules/auth/pages/VerifyOtpPage";
import HomePage from "../modules/home/pages/HomePage";

import ProtectedRoute from "../routes/ProtectedRoute";
import Page403 from "../modules/errors/403";
import Page404 from "../modules/errors/404";

import DashboardPage from "../modules/admin/pages/DashboardPage";
import AdminLayout from "../modules/admin/components/AdminLayout";
import UserPage from "../modules/admin/pages/UserManagementPage";
import CategoryPage from "../modules/admin/pages/CategoryManagementPage";

import ProfilePage from "../modules/profile/pages/ProfilePage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        <Route path="/403" element={<Page403 />} />
        <Route path="/404" element={<Page404 />} />

        {/* Profile Route for all logged in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="categories" element={<CategoryPage/>} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
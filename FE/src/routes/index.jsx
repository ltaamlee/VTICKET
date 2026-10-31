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
import OrganizerRequestsPage from "../modules/admin/pages/OrganizerRequestsPage";

import ProfilePage from "../modules/profile/pages/ProfilePage";
import OrganizerRegisterPage from "../modules/organizer/pages/OrganizerRegisterPage";
import MyTicketsPage from "../modules/ticket/pages/MyTicketsPage";
import MembershipPage from "../modules/membership/pages/MembershipPage";
import MyEventsPage from "../modules/event/pages/MyEventsPage";

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

        {/* User Protected Routes: Profile & Feature Pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/my-events" element={<MyEventsPage />} />
          <Route path="/organizer/register" element={<OrganizerRegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="categories" element={<CategoryPage/>} />
            <Route path="organizer-requests" element={<OrganizerRequestsPage />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
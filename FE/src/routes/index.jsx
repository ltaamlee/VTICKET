import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../modules/auth/pages/LoginPage";
import RegisterPage from "../modules/auth/pages/RegisterPage";
import ForgotPasswordPage from "../modules/auth/pages/ForgotPasswordPage";
import VerifyOtpPage from "../modules/auth/pages/VerifyOtpPage";
import HomePage from "../modules/home/pages/HomePage";

import ProtectedRoute from "../routes/ProtectedRoute";
import Page403 from "../modules/errors/403";
import Page404 from "../modules/errors/404";

import AdminDashboardPage from "../modules/admin/pages/DashboardPage";
import AdminLayout from "../layout/admin/AdminLayout";
import UserPage from "../modules/admin/pages/UserManagementPage";
import CategoryPage from "../modules/admin/pages/CategoryManagementPage";
import AdminEventPage from "../modules/admin/pages/EventManagementPage";
import ForumManagement from "../modules/admin/pages/ForumManagement";
import SystemPage from "../modules/admin/pages/SystemManagementPage";

import OrganizerRequestsPage from "../modules/admin/pages/OrganizerRequestsPage";
import ProfilePage from "../modules/profile/pages/ProfilePage";
import OrganizerRegisterPage from "../modules/organizer/pages/OrganizerRegisterPage";
import MyTicketsPage from "../modules/ticket/pages/MyTicketsPage";
import OrderPage from "../modules/ticket/pages/OrderPage";
import OrderSuccessPage from "../modules/ticket/pages/OrderSuccessPage";
import EventListPage from "../modules/event/pages/EventListPage";
import EventDetailPage from "../modules/event/pages/EventDetailPage";
import ResalePage from "../modules/resale/pages/ResalePage";
import ResaleEventTicketsPage from "../modules/resale/pages/ResaleEventTicketsPage";
import ResaleOrderPage from "../modules/resale/pages/ResaleOrderPage";
import ResaleDetailPage from "../modules/resale/pages/ResaleDetailPage";
import MyResalePage from "../modules/resale/pages/MyResalePage";
import WalletPage from "../modules/wallet/pages/WalletPage";
import ForumListPage from "../modules/forum/pages/ForumListPage";
import PostDetailPage from "../modules/forum/pages/PostDetailPage";

import OrganizerLayout from "../layout/organizer/OrganizerLayout";
import AccountLayout from "../layout/AccountLayout";
import OrganizerEventPage from "../modules/organizer/pages/EventManagementPage";
import OrganizerDashboardPage from "../modules/organizer/pages/DashboardPage";
import OrganizerTicketPage from "../modules/organizer/pages/TicketManagementPage";
import OrganizerCheckInPage from "../modules/organizer/pages/CheckInManagementPage";
import SeatMapEditorPage from "../modules/organizer/pages/SeatMapEditorPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:idOrSlug" element={<EventDetailPage />} />
        <Route path="/forum" element={<ForumListPage />} />
        <Route path="/forum/:id" element={<PostDetailPage />} />
        <Route path="/events/:idOrSlug" element={<EventDetailPage key="event-detail" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        <Route path="/403" element={<Page403 />} />
        <Route path="/404" element={<Page404 />} />

        {/* Resale (bán lại vé) */}
        <Route path="/resales" element={<ResalePage />} />
        {/* Phải đặt trước "/resales/:id" để không bị route động nuốt mất */}
        <Route path="/resales/events/:eventId" element={<ResaleEventTicketsPage />} />
        <Route path="/resales/orders/:orderId" element={<ResaleOrderPage />} />
        <Route path="/resales/:id" element={<ResaleDetailPage />} />

        {/* Customer account and ticket routes */}
        <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
          <Route path="/orders/:id" element={<OrderPage />} />
          <Route path="/orders/:id/success" element={<OrderSuccessPage />} />
          <Route path="/organizer/register" element={<OrganizerRegisterPage />} />
          <Route path="/events/:idOrSlug/booking" element={<EventDetailPage key="event-booking" booking />} />

          {/* Khu vực tài khoản khách hàng (layout Ticketbox-style) */}
          <Route element={<AccountLayout />}>
            <Route path="/my-tickets" element={<MyTicketsPage />} />
            <Route path="/my-resales" element={<MyResalePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="organizer-requests" element={<OrganizerRequestsPage />} />
            <Route path="events" element={<AdminEventPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="forum" element={<ForumManagement />} />
            <Route path="profile" element={<ProfilePage embedded />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ORGANIZER"]} />}>
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<OrganizerDashboardPage />} />
            <Route path="dashboard" element={<OrganizerDashboardPage />} />
            <Route path="events" element={<OrganizerEventPage />} />
            <Route path="tickets" element={<OrganizerTicketPage />} />
            <Route path="check-in" element={<OrganizerCheckInPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="profile" element={<ProfilePage embedded />} />
          </Route>
          <Route path="/organizer/seat-maps/new" element={<SeatMapEditorPage />} />
          <Route path="/organizer/seat-maps/:seatMapId/edit" element={<SeatMapEditorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

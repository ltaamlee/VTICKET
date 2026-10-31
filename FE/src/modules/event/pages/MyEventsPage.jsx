import { Link } from "react-router-dom";
import AccountLayout from "../../../components/layout/AccountLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Calendar,
  Building2,
  Plus,
  Sparkles,
} from "lucide-react";

export default function MyEventsPage() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "ORGANIZER";

  return (
    <AccountLayout>
      {/* Tiêu đề trang */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {isOrganizer ? "Sự kiện bạn tổ chức" : "Sự kiện của tôi"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isOrganizer
              ? "Bảng quản lý sự kiện, theo dõi số lượng vé bán và vận hành chương trình"
              : "Các sự kiện bạn đã quan tâm, đăng ký tham gia hoặc yêu thích"}
          </p>
        </div>

        {isOrganizer && (
          <Link
            to="/organizer/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Tạo sự kiện mới
          </Link>
        )}
      </div>

      {/* NỘI DUNG DÀNH CHO BAN TỔ CHỨC */}
      {isOrganizer ? (
        <div className="space-y-6">
          {/* Thống kê nhanh của BTC */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Sự kiện đang mở bán</p>
              <p className="mt-2 text-2xl font-black text-gray-900">0</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-blue-600 uppercase">Vé đã bán</p>
              <p className="mt-2 text-2xl font-black text-blue-700">0</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-emerald-600 uppercase">Doanh thu tạm tính</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">0 đ</p>
            </div>
          </div>

          {/* Danh sách sự kiện tổ chức */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 sm:p-14 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-inner">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Bạn chưa tạo sự kiện nào
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Bắt đầu tạo sự kiện âm nhạc, hội thảo, thể thao hoặc workshop để tiếp cận hàng triệu người tham dự trên nền tảng VTicket!
            </p>
            <div className="mt-6">
              <Link
                to="/organizer/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 shadow-md transition"
              >
                <Plus className="h-4 w-4" />
                Bắt đầu tạo sự kiện ngay
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* NỘI DUNG DÀNH CHO USER THƯỜNG */
        <div className="space-y-6">
          {/* Danh sách sự kiện đã tham gia hoặc theo dõi */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 sm:p-14 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Bạn chưa có sự kiện nào
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Các chương trình ca nhạc, liveshow và hội thảo hot nhất đang diễn ra. Đăng ký tham gia ngay để lưu vào danh sách sự kiện của bạn!
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                Khám phá sự kiện hot
              </Link>
            </div>
          </div>

          {/* Banner quảng bá Đăng ký làm Ban Tổ Chức */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  Bạn có kế hoạch tổ chức sự kiện hoặc minishow của riêng mình?
                </h4>
                <p className="mt-1 text-xs text-gray-600 max-w-xl leading-relaxed">
                  Đăng ký trở thành <strong>Ban Tổ Chức (BTC)</strong> trên VTicket hoàn toàn miễn phí. Hưởng trọn công cụ bán vé thông minh, tạo sơ đồ ghế ngồi tự động và check-in QR bảo mật cao!
                </p>
              </div>
            </div>

            <Link
              to="/organizer/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-black transition shrink-0"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Đăng ký làm BTC ngay
            </Link>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

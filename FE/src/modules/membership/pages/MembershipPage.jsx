import AccountLayout from "../../../components/layout/AccountLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Gem,
  Award,
  Star,
  QrCode,
  CheckCircle2,
  Gift,
} from "lucide-react";

export default function MembershipPage() {
  const { user } = useAuth();

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* THẺ THÀNH VIÊN ĐIỆN TỬ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-7 sm:p-9 text-white shadow-xl">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Gem className="h-72 w-72" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <Gem className="h-3.5 w-3.5 text-amber-400" />
                  VTicket Membership Pass
                </span>
                <h3 className="mt-3 text-2xl font-black tracking-wide">
                  {user?.role === "ORGANIZER" ? "THÀNH VIÊN ĐỐI TÁC BTC" : "THÀNH VIÊN TIÊU CHUẨN"}
                </h3>
              </div>
              <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-md border border-white/20">
                <QrCode className="h-10 w-10 text-white" />
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Chủ tài khoản</p>
                <p className="font-bold text-lg text-white">
                  {user?.fullName || user?.email || "Quý khách"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Điểm tích lũy</p>
                  <p className="font-black text-2xl text-amber-400">100 VP</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Hạng thẻ</p>
                  <span className="font-bold text-sm text-emerald-400">Silver Tier</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ĐẶC QUYỀN HẠNG THÀNH VIÊN */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Đặc quyền dành riêng cho bạn
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3 text-base">
                %
              </div>
              <h4 className="font-bold text-sm text-gray-900">Chiết khấu mua vé</h4>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Tích lũy điểm V-Points trên mỗi giao dịch thành công để quy đổi voucher giảm giá lên đến 15%.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Star className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-900">Ưu tiên giữ chỗ sớm</h4>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Được quyền truy cập cổng mở bán sớm (Early Bird) trước công chúng 24 giờ cho các liveshow hot.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-900">Lối check-in ưu tiên</h4>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Sử dụng làn check-in nhanh qua QR Code thẻ thành viên tại các sự kiện hợp tác với VTicket.
              </p>
            </div>
          </div>
        </div>

        {/* BẢNG QUY ĐỔI ĐIỂM & THĂNG HẠNG */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-600" />
            Chính sách thăng hạng hội viên
          </h3>

          <div className="divide-y divide-gray-100 text-sm">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Thành viên Đồng (Bronze)</p>
                <p className="text-xs text-gray-500">Mặc định khi đăng ký tài khoản thành công</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">0 VP</span>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Thành viên Bạc (Silver) - Hạng hiện tại</p>
                <p className="text-xs text-gray-500">Tích lũy từ 100 điểm V-Points</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">100 VP</span>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Thành viên Vàng (Gold)</p>
                <p className="text-xs text-gray-500">Tích lũy từ 500 điểm V-Points (Giảm 10% vé)</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">500 VP</span>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Thành viên Kim Cương (Diamond)</p>
                <p className="text-xs text-gray-500">Tích lũy từ 1.500 điểm V-Points (Ưu đãi tối đa + Quà sinh nhật)</p>
              </div>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">1,500 VP</span>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}

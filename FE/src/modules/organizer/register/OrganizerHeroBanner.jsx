import { Ticket, Calendar, CreditCard, Headphones } from "lucide-react";

export default function OrganizerHeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 py-14 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-sm ring-1 ring-blue-400/30">
            Dành cho Đối tác & Nhà tổ chức
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Đăng ký trở thành{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Ban Tổ Chức
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-300 sm:text-lg">
            Đưa sự kiện âm nhạc, thể thao và văn hóa của bạn tiếp cận hàng triệu khán giả trẻ trên toàn quốc thông qua nền tảng vé điện tử VTicket.
          </p>
        </div>

        {/* 4 Lợi thế nổi bật */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
            <Ticket className="h-6 w-6 text-blue-400 mb-2" />
            <h4 className="font-semibold text-sm text-white">Bán vé nhanh chóng</h4>
            <p className="mt-1 text-xs text-gray-400">Tạo loại vé, đặt giá và mở bán tức thì trong 5 phút.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
            <Calendar className="h-6 w-6 text-indigo-400 mb-2" />
            <h4 className="font-semibold text-sm text-white">Sơ đồ ghế trực quan</h4>
            <p className="mt-1 text-xs text-gray-400">Thiết kế phân khu và chọn ghế ngồi động theo từng suất diễn.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
            <CreditCard className="h-6 w-6 text-emerald-400 mb-2" />
            <h4 className="font-semibold text-sm text-white">Thanh toán đa dạng</h4>
            <p className="mt-1 text-xs text-gray-400">Tích hợp MoMo, VNPAY, ZaloPay & đối soát tự động.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
            <Headphones className="h-6 w-6 text-amber-400 mb-2" />
            <h4 className="font-semibold text-sm text-white">Hỗ trợ check-in sự kiện</h4>
            <p className="mt-1 text-xs text-gray-400">Ứng dụng quét mã QR vé siêu tốc, chống vé giả tuyệt đối.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

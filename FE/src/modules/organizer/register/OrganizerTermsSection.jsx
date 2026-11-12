import { ShieldCheck, Loader2 } from "lucide-react";

export default function OrganizerTermsSection({
  agreedTerms,
  setAgreedTerms,
  isEditing,
  setIsEditing,
  submitting,
}) {
  return (
    <>
      {/* PHẦN 4: ĐIỀU KHOẢN & QUY ĐỊNH DÀNH CHO BAN TỔ CHỨC */}
      <div className="mb-8">
        <label className="text-xs font-semibold uppercase text-gray-600 block mb-2">
          4. Điều khoản & Quy định dành cho Ban Tổ Chức (VTicket Partner Terms)
        </label>

        {/* Khung cuộn văn bản điều khoản */}
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-xs text-gray-600 leading-relaxed space-y-3">
          <h5 className="font-bold text-gray-800 text-sm">QUY CHẾ HOẠT ĐỘNG VÀ ĐIỀU KHOẢN HỢP TÁC BAN TỔ CHỨC</h5>

          <div>
            <strong className="text-gray-800">Điều 1: Tính hợp pháp của sự kiện</strong>
            <p>Ban Tổ Chức (BTC) cam kết sở hữu đầy đủ giấy phép biểu diễn, văn bản chấp thuận từ các cơ quan có thẩm quyền theo quy định của pháp luật Việt Nam. BTC chịu hoàn toàn trách nhiệm pháp lý đối với nội dung sự kiện và bản quyền tác phẩm.</p>
          </div>

          <div>
            <strong className="text-gray-800">Điều 2: Phát hành vé và kiểm soát vé</strong>
            <p>Mọi vé được phát hành qua nền tảng VTicket đều mang mã định danh duy nhất (QR Token bảo mật). BTC có trách nhiệm sử dụng ứng dụng kiểm soát vé của VTicket để bảo đảm quyền lợi chính đáng cho người tham gia.</p>
          </div>

          <div>
            <strong className="text-gray-800">Điều 3: Chính sách hoãn, hủy sự kiện và hoàn tiền</strong>
            <p>Trong trường hợp sự kiện bị hoãn, thay đổi địa điểm hoặc bị hủy bỏ vì bất kỳ lý do gì, BTC có nghĩa vụ thông báo kịp thời cho VTicket và chịu trách nhiệm hoàn 100% giá trị tiền vé cho khách hàng theo đúng chính sách bảo vệ người tiêu dùng.</p>
          </div>

          <div>
            <strong className="text-gray-800">Điều 4: Đối soát doanh thu và thanh toán</strong>
            <p>VTicket sẽ đối soát doanh thu bán vé trừ đi phí dịch vụ nền tảng theo hợp đồng đã thống nhất. Tiền doanh thu sẽ được chuyển khoản vào tài khoản ngân hàng của BTC trong vòng từ 03 đến 05 ngày làm việc sau khi sự kiện kết thúc thành công và không có khiếu nại phát sinh.</p>
          </div>

          <div>
            <strong className="text-gray-800">Điều 5: Bảo mật thông tin khách hàng</strong>
            <p>BTC cam kết bảo mật tuyệt đối thông tin cá nhân của người mua vé và chỉ sử dụng cho mục đích vận hành, điều phối sự kiện theo quy định của Luật An ninh mạng.</p>
          </div>
        </div>

        {/* Checkbox đồng ý điều khoản */}
        <div className="mt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-xs text-gray-700 font-medium select-none">
              Tôi xác nhận đã đọc, hiểu rõ và cam kết tuân thủ toàn bộ{" "}
              <strong className="text-blue-600">Điều khoản & Quy định dành cho Ban Tổ Chức</strong> của VTicket.
            </span>
          </label>
        </div>
      </div>

      {/* NÚT SUBMIT */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={submitting}
            className="w-full sm:w-auto rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy sửa
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !agreedTerms}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý hồ sơ...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              {isEditing ? "Lưu thay đổi hồ sơ" : "Gửi hồ sơ đăng ký Ban Tổ Chức"}
            </>
          )}
        </button>
      </div>
    </>
  );
}

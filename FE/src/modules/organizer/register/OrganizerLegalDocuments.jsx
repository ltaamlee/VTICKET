import { useState } from "react";
import { UploadCloud, Eye, X } from "lucide-react";
import ImagePreviewModal from "../../../components/common/ImagePreviewModal";

export default function OrganizerLegalDocuments({
  organizerType,
  idCardNumber,
  setIdCardNumber,
  idFrontImage,
  setIdFrontImage,
  idBackImage,
  setIdBackImage,
  taxCode,
  setTaxCode,
  businessLicense,
  setBusinessLicense,
  description,
  setDescription,
  uploadingFront,
  uploadingBack,
  uploadingLicense,
  handleUploadFile,
}) {
  const [previewImage, setPreviewImage] = useState(null);

  return (
    <div className="mb-8">
      <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">
        3. Thông tin pháp lý & Tài liệu xác minh
      </label>

      {organizerType === "INDIVIDUAL" ? (
        /* Form dành cho CÁ NHÂN */
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Số CCCD / Hộ chiếu cá nhân <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
              placeholder="Nhập 12 chữ số CCCD gắn chip"
              required
              className="w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mặt trước CCCD */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Ảnh CCCD mặt trước
              </label>
              {idFrontImage ? (
                <div
                  onClick={() =>
                    setPreviewImage({
                      url: idFrontImage,
                      title: "Ảnh CCCD mặt trước",
                    })
                  }
                  className="group relative h-32 w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                >
                  <img
                    src={idFrontImage}
                    alt="Mặt trước CCCD"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      <Eye className="h-4 w-4" />
                      <span>Xem ảnh</span>
                    </div>
                  </div>
                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdFrontImage("");
                    }}
                    className="absolute top-2 right-2 z-10 rounded-full bg-red-600/90 p-1 text-white shadow hover:bg-red-700 transition"
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 transition">
                  <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-medium text-gray-600">
                    {uploadingFront ? "Đang tải ảnh lên..." : "Tải ảnh mặt trước"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadFile(e, "front")}
                    disabled={uploadingFront}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Mặt sau CCCD */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Ảnh CCCD mặt sau
              </label>
              {idBackImage ? (
                <div
                  onClick={() =>
                    setPreviewImage({
                      url: idBackImage,
                      title: "Ảnh CCCD mặt sau",
                    })
                  }
                  className="group relative h-32 w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                >
                  <img
                    src={idBackImage}
                    alt="Mặt sau CCCD"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      <Eye className="h-4 w-4" />
                      <span>Xem ảnh</span>
                    </div>
                  </div>
                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdBackImage("");
                    }}
                    className="absolute top-2 right-2 z-10 rounded-full bg-red-600/90 p-1 text-white shadow hover:bg-red-700 transition"
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 transition">
                  <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-medium text-gray-600">
                    {uploadingBack ? "Đang tải ảnh lên..." : "Tải ảnh mặt sau"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadFile(e, "back")}
                    disabled={uploadingBack}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Form dành cho DOANH NGHIỆP */
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Mã số thuế doanh nghiệp (MST) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              placeholder="VD: 0101234567"
              required
              className="w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Ảnh Giấy phép đăng ký kinh doanh (GPKD)
            </label>
            {businessLicense ? (
              <div
                onClick={() =>
                  setPreviewImage({
                    url: businessLicense,
                    title: "Giấy phép đăng ký kinh doanh (GPKD)",
                  })
                }
                className="group relative h-40 w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
              >
                <img
                  src={businessLicense}
                  alt="GPKD"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    <Eye className="h-4 w-4" />
                    <span>Xem ảnh</span>
                  </div>
                </div>
                {/* Nút xóa ảnh */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBusinessLicense("");
                  }}
                  className="absolute top-2 right-2 z-10 rounded-full bg-red-600/90 p-1 text-white shadow hover:bg-red-700 transition"
                  title="Xóa ảnh"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 transition">
                <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-xs font-medium text-gray-600">
                  {uploadingLicense ? "Đang tải ảnh lên..." : "Tải lên ảnh giấy phép kinh doanh"}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">JPG, PNG hoặc WEBP (Tối đa 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadFile(e, "license")}
                  disabled={uploadingLicense}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Giới thiệu đơn vị */}
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
          Giới thiệu kinh nghiệm tổ chức sự kiện & Kế hoạch sắp tới
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn gọn về các chương trình, minishow, hội thảo bạn từng tổ chức hoặc kế hoạch sự kiện dự kiến tổ chức trên VTicket..."
          className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* DÙNG CHUNG MODAL PHÓNG TO ẢNH */}
      <ImagePreviewModal
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

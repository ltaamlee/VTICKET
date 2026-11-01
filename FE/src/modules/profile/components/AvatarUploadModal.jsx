import { Camera, X, AlertCircle, CheckCircle2, UploadCloud, Loader2 } from "lucide-react";

export default function AvatarUploadModal({
  show,
  onClose,
  fileInputRef,
  handleFileSelect,
  filePreview,
  selectedFile,
  uploadingAvatar,
  avatarError,
  avatarSuccess,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleUploadAvatar,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Cập nhật ảnh đại diện
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tải ảnh từ thiết bị của bạn lên Cloudinary.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploadingAvatar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thông báo lỗi */}
        {avatarError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {avatarSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{avatarSuccess}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* KHU VỰC TẢI LÊN CLOUDINARY */}
        <div className="mb-5">
          {filePreview ? (
            /* Xem trước ảnh đã chọn */
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-center">
              <div className="relative mx-auto mb-3 h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-md">
                <img
                  src={filePreview}
                  alt="Preview Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate max-w-xs mx-auto">
                {selectedFile?.name}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Chọn ảnh khác
                </button>
                <button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Tải lên & Lưu
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Dropzone kéo thả */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                isDragging
                  ? "border-blue-500 bg-blue-50/70 scale-[1.01]"
                  : "border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Kéo thả ảnh vào đây hoặc{" "}
                <span className="text-blue-600 underline">chọn từ thiết bị</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Định dạng hỗ trợ: PNG, JPG, JPEG, WEBP (Tối đa 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Đóng modal */}
        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploadingAvatar}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

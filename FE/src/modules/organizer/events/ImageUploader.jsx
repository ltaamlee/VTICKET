
import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, ImagePlus } from "lucide-react";

function ImageUploader({
    title,
    ratio,
    recommendation,
    file,
    setFile,
    imageUrl = "",
    setImageUrl,
    onAlert,
    maxSize = 5,
}) {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [dragging, setDragging] = useState(false);

    // Tạo ảnh xem trước khi chọn file mới
    useEffect(() => {
        if (!file) {
            setPreviewUrl("");
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Ưu tiên ảnh mới, nếu không có thì hiển thị ảnh cũ
    const displayUrl = previewUrl || imageUrl;

    const handleSelectImage = (selectedFile) => {
        if (!selectedFile) return;

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            onAlert?.("error", "Chỉ chấp nhận ảnh PNG, JPG hoặc WEBP.");
            return;
        }

        if (selectedFile.size > maxSize * 1024 * 1024) {
            onAlert?.(
                "error",
                `Kích thước ảnh không được vượt quá ${maxSize}MB.`
            );
            return;
        }

        setFile(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleSelectImage(e.dataTransfer.files?.[0]);
    };

    const removeImage = () => {
        setFile(null);
        setImageUrl?.("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const aspectClass =
        ratio === "16:9" ? "aspect-video" : "aspect-square";

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700">
                        {title}
                    </label>

                    <p className="mt-1 text-xs text-gray-400">
                        {recommendation}
                    </p>
                </div>

                <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    {ratio}
                </span>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                    handleSelectImage(e.target.files?.[0]);
                    e.target.value = "";
                }}
            />

            {!displayUrl ? (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex ${aspectClass} cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
                        dragging
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Upload size={20} className="text-blue-600" />
                    </div>

                    <p className="text-sm font-medium text-gray-700">
                        Tải ảnh lên
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                        Kéo thả hoặc nhấn để chọn ảnh
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        PNG, JPG, WEBP · Tối đa {maxSize}MB
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className={`relative ${aspectClass} bg-gray-50`}>
                        <img
                            src={displayUrl}
                            alt={title}
                            className="h-full w-full object-contain"
                        />

                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
                        >
                            <Trash2 size={14} />
                            Xóa
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <ImagePlus
                                size={16}
                                className="shrink-0 text-blue-600"
                            />

                            <span className="truncate text-xs text-gray-600">
                                {file?.name || "Ảnh hiện tại"}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
                        >
                            Đổi ảnh
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageUploader;
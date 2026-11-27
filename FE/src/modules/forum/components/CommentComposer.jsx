import { useId, useState, useRef, useEffect } from "react";
import { ArrowUp, ImagePlus, Maximize2, Minimize2, Smile, User, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { uploadForumImage } from "../services/forumService";
import GifPicker from "./GifPicker";
import EmojiPicker from "./EmojiPicker";


function CommentComposer({
    id,
    label,
    labelHidden = true,
    initialValue = "",
    placeholder = "Viết bình luận...",
    emptyErrorMessage = "Vui lòng nhập nội dung bình luận.",
    fallbackErrorMessage = "Không thể gửi bình luận.",
    clearOnSuccess = false,
    autoFocus = false,
    className = "",
    onSubmit,
    onCancel,
}) {
    const inputId = useId();
    const errorId = useId();
    const textareaRef = useRef(null);
    const { user } = useAuth();

    const [content, setContent] = useState(initialValue);
    const [mediaUrls, setMediaUrls] = useState([]);
    const [gifUrl, setGifUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const pickerRef = useRef(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!showEmojiPicker && !showGifPicker) return;
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
                setShowGifPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker, showGifPicker]);
    const [submitting, setSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    // Tự động điều chỉnh chiều cao textarea theo nội dung
    useEffect(() => {
        if (!isExpanded && textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [content, isExpanded]);

    const submit = async () => {
        const trimmed = content.trim();
        if (!trimmed && mediaUrls.length === 0 && !gifUrl) {
            setError(emptyErrorMessage);
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            await onSubmit?.(trimmed, { mediaUrls, gifUrl: gifUrl || null });
            if (clearOnSuccess) {
                setContent("");
                setMediaUrls([]);
                setGifUrl("");
                setShowEmojiPicker(false);
                setShowGifPicker(false);
                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                }
            }
        } catch (err) {
            setError(err.message || fallbackErrorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!submitting) {
            submit();
        }
    };

    const handleKeyDown = (e) => {
        // Ấn Enter không kèm Shift để gửi luôn (chuẩn Threads / Messenger)
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (!submitting) {
                submit();
            }
        }
    };

    const userInitial = user?.fullName?.[0] || user?.name?.[0] || "U";
    const userAvatar = user?.avatarUrl || user?.avatar;

    return (
        <form
            id={id}
            onSubmit={handleFormSubmit}
            noValidate
            className={`space-y-1.5 ${className}`}
        >
            {label && !labelHidden && (
                <label
                    htmlFor={inputId}
                    className="block text-xs font-semibold text-slate-700"
                >
                    {label}
                </label>
            )}

            {/* Thanh Pill Bar bo tròn chuẩn Threads */}
            <div
                className={`relative flex items-center gap-2.5 transition-all duration-200 border border-slate-200/90 bg-slate-100/80 hover:bg-slate-100 focus-within:border-slate-400 focus-within:bg-white focus-within:shadow-xs ${
                    isExpanded ? "rounded-2xl p-3 items-start" : "rounded-full px-3.5 py-1.5"
                }`}
            >
                {/* Avatar người dùng bên trái */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-300 text-xs font-bold text-slate-700">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                        />
                    ) : user ? (
                        <span>{userInitial.toUpperCase()}</span>
                    ) : (
                        <User className="h-4 w-4 text-slate-500" />
                    )}
                </div>

                {/* Ô nhập bình luận tự co giãn */}
                <textarea
                    ref={textareaRef}
                    id={inputId}
                    rows={isExpanded ? 3 : 1}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        if (error) setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={submitting}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className="min-h-[28px] max-h-36 flex-1 resize-none border-none bg-transparent p-0 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />

                {/* Cụm công cụ bên phải: Ảnh, GIF, phóng to & Nút gửi */}
                <div className="flex shrink-0 items-center gap-1.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            try {
                                setUploadingImage(true);
                                setError("");
                                const res = await uploadForumImage(file);
                                const url = res?.data?.url || res?.url;
                                if (url) setMediaUrls([url]);
                            } catch (err) {
                                setError(err.message || "Không thể tải ảnh lên.");
                            } finally {
                                setUploadingImage(false);
                            }
                        }}
                    />
                    <button
                        type="button"
                        disabled={submitting || uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        title="Thêm ảnh"
                        aria-label="Thêm ảnh"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-blue-600 disabled:opacity-50"
                    >
                        <ImagePlus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            setShowEmojiPicker(false);
                            setShowGifPicker((prev) => !prev);
                        }}
                        title="Chọn GIF"
                        aria-label="Chọn GIF"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-amber-500 disabled:opacity-50"
                    >
                        <span className="rounded border border-current px-0.5 py-0.5 text-[9px] font-bold leading-none">
                            GIF
                        </span>
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            setShowGifPicker(false);
                            setShowEmojiPicker((prev) => !prev);
                        }}
                        title="Chèn biểu tượng cảm xúc"
                        aria-label="Chèn biểu tượng cảm xúc"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-amber-500 disabled:opacity-50"
                    >
                        <Smile className="h-3.5 w-3.5" />
                    </button>
                    {/* Nút phóng to / thu nhỏ */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
                        aria-label={isExpanded ? "Thu nhỏ" : "Mở rộng"}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700"
                    >
                        {isExpanded ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                        ) : (
                            <Maximize2 className="h-3.5 w-3.5" />
                        )}
                    </button>

                    {/* Nút hủy nếu là form reply hoặc edit */}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            title="Hủy"
                            aria-label="Hủy"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Nút tròn màu đen có icon mũi tên hướng lên (ArrowUp) gửi ngay */}
                    <button
                        type="submit"
                        disabled={submitting || (!content.trim() && mediaUrls.length === 0 && !gifUrl)}
                        title="Gửi (Enter)"
                        aria-label="Gửi bình luận"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-xs transition-all hover:bg-black active:scale-90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50"
                    >
                        <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {(showGifPicker || showEmojiPicker) && (
                <div ref={pickerRef} className="relative z-30">
                    {showGifPicker && (
                        <GifPicker
                            onSelect={(url) => setGifUrl(url)}
                            onClose={() => setShowGifPicker(false)}
                        />
                    )}
                    {showEmojiPicker && (
                        <EmojiPicker
                            onSelect={(emoji) => setContent((prev) => `${prev}${emoji}`)}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    )}
                </div>
            )}

            {(mediaUrls.length > 0 || gifUrl) && (
                <div className="flex flex-wrap gap-2 px-1">
                    {mediaUrls.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== idx))}
                                aria-label="Xóa ảnh"
                                className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {gifUrl && (
                        <div className="relative h-20 w-24 overflow-hidden rounded-xl border border-slate-200">
                            <img src={gifUrl} alt="GIF đã chọn" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setGifUrl("")}
                                aria-label="Xóa GIF"
                                className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p id={errorId} aria-live="polite" className="px-2 text-xs font-medium text-red-600">
                    {error}
                </p>
            )}
        </form>
    );
}

export default CommentComposer;

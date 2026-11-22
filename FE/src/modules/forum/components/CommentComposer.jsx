import { useId, useState, useRef, useEffect } from "react";
import { ArrowUp, Maximize2, Minimize2, User, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";


function CommentComposer({
    id,
    label,
    labelHidden = true,
    initialValue = "",
    placeholder = "Viết bình luận...",
    emptyErrorMessage = "Vui lòng nhập nội dung bình luận.",
    fallbackErrorMessage = "Không thể gửi bình luận.",
    clearOnSuccess = false,
    className = "",
    onSubmit,
    onCancel,
}) {
    const inputId = useId();
    const errorId = useId();
    const textareaRef = useRef(null);
    const { user } = useAuth();

    const [content, setContent] = useState(initialValue);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Tự động điều chỉnh chiều cao textarea theo nội dung
    useEffect(() => {
        if (!isExpanded && textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [content, isExpanded]);

    const submit = async () => {
        const trimmed = content.trim();
        if (!trimmed) {
            setError(emptyErrorMessage);
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            await onSubmit?.(trimmed);
            if (clearOnSuccess) {
                setContent("");
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

                {/* Cụm công cụ bên phải: Nút phóng to & Nút gửi mũi tên lên màu đen */}
                <div className="flex shrink-0 items-center gap-1.5">
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
                        disabled={submitting || !content.trim()}
                        title="Gửi (Enter)"
                        aria-label="Gửi bình luận"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-xs transition-all hover:bg-black active:scale-90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50"
                    >
                        <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {error && (
                <p id={errorId} aria-live="polite" className="px-2 text-xs font-medium text-red-600">
                    {error}
                </p>
            )}
        </form>
    );
}

export default CommentComposer;

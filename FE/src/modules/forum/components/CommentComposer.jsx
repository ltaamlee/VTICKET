import { useId, useState } from "react";
import Button from "../../../components/common/button/Button";

function CommentComposer({
    id,
    label,
    labelHidden = false,
    initialValue = "",
    rows = 3,
    placeholder = "",
    emptyErrorMessage = "Vui lòng nhập nội dung bình luận.",
    fallbackErrorMessage = "Không thể gửi bình luận.",
    submitLabel = "Gửi",
    cancelLabel = "Hủy",
    buttonSize = "md",
    clearOnSuccess = false,
    className = "",
    onSubmit,
    onCancel,
}) {
    const inputId = useId();
    const errorId = useId();

    const [content, setContent] = useState(initialValue);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

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
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (!submitting) {
                submit();
            }
        }
    };

    return (
        <form id={id} onSubmit={handleFormSubmit} noValidate className={`space-y-2 ${className}`}>
            <label
                htmlFor={inputId}
                className={
                    labelHidden
                        ? "sr-only"
                        : buttonSize === "sm"
                            ? "block text-xs font-medium text-slate-600"
                            : "block text-sm font-medium text-slate-700"
                }
            >
                {label}
            </label>

            <textarea
                id={inputId}
                rows={rows}
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
                className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-500"
            />

            {error && (
                <p id={errorId} aria-live="polite" className="text-xs font-medium text-red-600">
                    {error}
                </p>
            )}

            <div className="flex items-center justify-end gap-2">
                {onCancel && (
                    <Button
                        type="button"
                        size={buttonSize}
                        variant="secondary"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        {cancelLabel}
                    </Button>
                )}
                <Button type="submit" size={buttonSize} loading={submitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

export default CommentComposer;


import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import Button from "../../../components/common/button/Button";
import { handleDialogBackdropClick } from "../../../utils/dialog";
import { createPost, updatePost } from "../services/forumService";
import { useTaggableEvents } from "../hooks/useTaggableEvents";
import { formatShortEventDate } from "../utils/forumHelpers";

function PostFormBody({
    headingId,
    editingPost = null,
    defaultEventId = "",
    lockedEvent = null,
    events = [],
    loadingEvents = false,
    onClose,
    onSuccess,
}) {
    const eventSelectId = useId();
    const titleInputId = useId();
    const titleErrorId = useId();
    const contentInputId = useId();
    const contentErrorId = useId();
    const statusLiveId = useId();

    const isEditing = Boolean(editingPost);
    const initialEventId = lockedEvent?.id
        ? lockedEvent.id
        : editingPost
            ? editingPost.eventId || ""
            : defaultEventId || "";

    const [eventId, setEventId] = useState(initialEventId);
    const [title, setTitle] = useState(editingPost?.title || "");
    const [content, setContent] = useState(editingPost?.content || "");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const selectableEvents = useMemo(() => {
        const list = [...events];
        const ensurePresent = (candidate) => {
            if (candidate?.id && !list.some((ev) => ev.id === candidate.id)) {
                list.unshift(candidate);
            }
        };
        if (lockedEvent) ensurePresent(lockedEvent);
        if (editingPost?.event) ensurePresent(editingPost.event);
        return list;
    }, [events, lockedEvent, editingPost]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        const errors = {};

        if (trimmedTitle.length < 3) {
            errors.title = "Tiêu đề bài viết cần ít nhất 3 ký tự.";
        }
        if (trimmedContent.length < 5) {
            errors.content = "Nội dung bài viết cần ít nhất 5 ký tự.";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            setSubmitting(true);
            setFieldErrors({});
            setSubmitError("");

            const payload = {
                title: trimmedTitle,
                content: trimmedContent,
                eventId: lockedEvent?.id ? lockedEvent.id : eventId || null,
            };

            const res = isEditing
                ? await updatePost(editingPost.id, payload)
                : await createPost(payload);

            onSuccess?.(res.data, isEditing ? "update" : "create");
        } catch (err) {
            setSubmitError(err.message || "Không thể lưu bài viết. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 id={headingId} className="text-lg font-bold text-slate-900">
                    {isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </h2>
                <button
                    type="button"
                    onClick={() => !submitting && onClose?.()}
                    disabled={submitting}
                    aria-label="Đóng cửa sổ"
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
                {submitError && (
                    <div
                        id={statusLiveId}
                        role="alert"
                        aria-live="polite"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {submitError}
                    </div>
                )}

                <div>
                    <label
                        htmlFor={eventSelectId}
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                        Chủ đề / Sự kiện liên quan
                    </label>
                    {lockedEvent ? (
                        <div
                            id={eventSelectId}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-medium text-blue-800"
                        >
                            {lockedEvent.name}
                        </div>
                    ) : (
                        <select
                            id={eventSelectId}
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            disabled={loadingEvents || submitting}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        >
                            <option value="">
                                Thảo luận chung (không gắn sự kiện)
                            </option>
                            {selectableEvents.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name}
                                    {ev.startAt ? ` (${formatShortEventDate(ev.startAt)})` : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label
                        htmlFor={titleInputId}
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                        Tiêu đề bài viết <span className="text-red-500">*</span>
                    </label>
                    <input
                        id={titleInputId}
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (fieldErrors.title) {
                                setFieldErrors((prev) => ({ ...prev, title: "" }));
                            }
                        }}
                        disabled={submitting}
                        maxLength={180}
                        required
                        aria-invalid={Boolean(fieldErrors.title)}
                        aria-describedby={fieldErrors.title ? titleErrorId : undefined}
                        placeholder="Ví dụ: Hỏi về chỗ gửi xe và check-in sự kiện..."
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-500"
                    />
                    {fieldErrors.title && (
                        <p
                            id={titleErrorId}
                            aria-live="polite"
                            className="mt-1.5 text-xs font-medium text-red-600"
                        >
                            {fieldErrors.title}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor={contentInputId}
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                        Nội dung <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id={contentInputId}
                        rows={6}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            if (fieldErrors.content) {
                                setFieldErrors((prev) => ({ ...prev, content: "" }));
                            }
                        }}
                        disabled={submitting}
                        required
                        aria-invalid={Boolean(fieldErrors.content)}
                        aria-describedby={fieldErrors.content ? contentErrorId : undefined}
                        placeholder="Chia sẻ câu hỏi, cảm nhận hoặc kinh nghiệm tham gia của bạn..."
                        className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-500"
                    />
                    {fieldErrors.content && (
                        <p
                            id={contentErrorId}
                            aria-live="polite"
                            className="mt-1.5 text-xs font-medium text-red-600"
                        >
                            {fieldErrors.content}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onClose?.()}
                        disabled={submitting}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" loading={submitting}>
                        {isEditing ? "Lưu thay đổi" : "Đăng bài viết"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function PostFormModal({
    isOpen,
    onClose,
    onSuccess,
    editingPost = null,
    defaultEventId = "",
    lockedEvent = null,
    preloadedEvents,
}) {
    const dialogRef = useRef(null);
    const headingId = useId();
    const shouldFetchEvents =
        isOpen && !lockedEvent && preloadedEvents === undefined;
    const { events: fetchedEvents, loadingEvents } = useTaggableEvents({
        enabled: shouldFetchEvents,
        limit: 50,
    });
    const events = preloadedEvents !== undefined ? preloadedEvents : fetchedEvents;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    const handleNativeClose = () => {
        if (isOpen) {
            onClose?.();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            closedby="any"
            aria-labelledby={headingId}
            onClose={handleNativeClose}
            onClick={(event) =>
                handleDialogBackdropClick(event, dialogRef.current, onClose)
            }
            className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
        >
            {isOpen && (
                <PostFormBody
                    key={editingPost?.id || lockedEvent?.id || defaultEventId || "new-post"}
                    headingId={headingId}
                    editingPost={editingPost}
                    defaultEventId={defaultEventId}
                    lockedEvent={lockedEvent}
                    events={events}
                    loadingEvents={loadingEvents}
                    onClose={onClose}
                    onSuccess={onSuccess}
                />
            )}
        </dialog>
    );
}

export default PostFormModal;


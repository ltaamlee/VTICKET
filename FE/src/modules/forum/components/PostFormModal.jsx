import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImagePlus, Smile, X } from "lucide-react";
import Button from "../../../components/common/button/Button";
import { handleDialogBackdropClick } from "../../../utils/dialog";
import { createPost, updatePost, uploadForumImage } from "../services/forumService";
import { useTaggableEvents } from "../hooks/useTaggableEvents";
import { formatShortEventDate } from "../utils/forumHelpers";
import GifPicker from "./GifPicker";
import EmojiPicker from "./EmojiPicker";

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
    const [content, setContent] = useState(editingPost?.content || "");
    const [mediaUrls, setMediaUrls] = useState(editingPost?.mediaUrls || []);
    const [gifUrl, setGifUrl] = useState(editingPost?.gifUrl || "");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const pickerRef = useRef(null);
    const [fieldErrors, setFieldErrors] = useState({});

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

        const trimmedContent = content.trim();
        const errors = {};

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

            const autoTitle = trimmedContent.split(/\r?\n/)[0].trim().slice(0, 120);
            const payload = {
                title: autoTitle,
                content: trimmedContent,
                mediaUrls,
                gifUrl: gifUrl || null,
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
                    <textarea
                        id={contentInputId}
                        rows={5}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            if (fieldErrors.content) {
                                setFieldErrors((prev) => ({ ...prev, content: "" }));
                            }
                        }}
                        disabled={submitting}
                        required
                        aria-label="Nội dung bài viết"
                        aria-invalid={Boolean(fieldErrors.content)}
                        aria-describedby={fieldErrors.content ? contentErrorId : undefined}
                        placeholder="Bạn đang nghĩ gì? Chia sẻ cùng mọi người..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition-colors focus:border-slate-300 focus:bg-white aria-invalid:border-red-500"
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

                {(mediaUrls.length > 0 || gifUrl) && (
                    <div className="flex flex-wrap gap-2.5">
                        {mediaUrls.map((url, idx) => (
                            <div key={`${url}-${idx}`} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
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
                            <div className="relative h-24 w-28 overflow-hidden rounded-xl border border-slate-200">
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

                <div className="relative flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                e.target.value = "";
                                if (!files.length) return;
                                const remaining = 4 - mediaUrls.length;
                                if (remaining <= 0) {
                                    setSubmitError("Tối đa 4 ảnh cho mỗi bài viết.");
                                    return;
                                }
                                try {
                                    setUploadingImage(true);
                                    setSubmitError("");
                                    const uploaded = await Promise.all(
                                        files.slice(0, remaining).map((f) => uploadForumImage(f))
                                    );
                                    const urls = uploaded
                                        .map((res) => res?.data?.url || res?.url)
                                        .filter(Boolean);
                                    setMediaUrls((prev) => [...prev, ...urls].slice(0, 4));
                                } catch (err) {
                                    setSubmitError(err.message || "Không thể tải ảnh lên.");
                                } finally {
                                    setUploadingImage(false);
                                }
                            }}
                        />
                        <button
                            type="button"
                            disabled={submitting || uploadingImage || mediaUrls.length >= 4}
                            onClick={() => fileInputRef.current?.click()}
                            title={uploadingImage ? "Đang tải ảnh..." : "Thêm ảnh"}
                            aria-label="Thêm ảnh"
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ImagePlus className="h-5 w-5" />
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
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="rounded border border-current px-1 py-0.5 text-[10px] font-bold leading-none">
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
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Smile className="h-5 w-5" />
                        </button>
                    </div>

                    {(showGifPicker || showEmojiPicker) && (
                        <div ref={pickerRef} className="absolute bottom-12 left-0 z-30">
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

                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onClose?.()}
                            disabled={submitting}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {isEditing ? "Lưu thay đổi" : "Đăng"}
                        </Button>
                    </div>
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


import { useId, useState } from "react";
import { RotateCcw, Search, X } from "lucide-react";
import { useTaggableEvents } from "../../../forum/hooks/useTaggableEvents";
import { formatShortEventDate } from "../../../forum/utils/forumHelpers";
import { MODERATION_STATUS_OPTIONS } from "./forumModerationConfig";

export default function ForumModerationToolbar({
    activeTab,
    keyword,
    status,
    eventId,
    postIdFilter,
    onKeywordSubmit,
    onStatusChange,
    onEventIdChange,
    onClearPostFilter,
    onReset,
}) {
    const searchInputId = useId();
    const statusSelectId = useId();
    const eventSelectId = useId();

    const [searchDraft, setSearchDraft] = useState(keyword);
    const { events: taggableEvents } = useTaggableEvents({
        enabled: activeTab === "posts",
        limit: 50,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onKeywordSubmit?.(searchDraft.trim());
    };

    const handleResetClick = () => {
        setSearchDraft("");
        onReset?.();
    };

    return (
        <search aria-label="Tìm kiếm và lọc kiểm duyệt diễn đàn">
            <form
                onSubmit={handleSubmit}
                className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <label htmlFor={searchInputId} className="sr-only">
                            Tìm kiếm nội dung hoặc tác giả
                        </label>
                        <Search
                            size={18}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                            aria-hidden="true"
                        />
                        <input
                            id={searchInputId}
                            type="search"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                }
                            }}
                            autoCorrect="off"
                            autoCapitalize="none"
                            placeholder={
                                activeTab === "posts"
                                    ? "Tìm theo tiêu đề, nội dung, email hoặc tên tác giả..."
                                    : "Tìm theo nội dung bình luận, tiêu đề bài viết, tác giả..."
                            }
                            className="w-full rounded-lg border border-gray-200 py-2.5 pr-9 pl-10 text-sm outline-none focus:border-blue-500"
                        />
                        {searchDraft && (
                            <button
                                type="button"
                                aria-label="Xóa từ khóa"
                                onClick={() => {
                                    setSearchDraft("");
                                    if (keyword) onKeywordSubmit?.("");
                                }}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div>
                            <label htmlFor={statusSelectId} className="sr-only">
                                Trạng thái
                            </label>
                            <select
                                id={statusSelectId}
                                value={status}
                                onChange={(e) => onStatusChange?.(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
                            >
                                {MODERATION_STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {activeTab === "posts" && (
                            <div>
                                <label htmlFor={eventSelectId} className="sr-only">
                                    Chủ đề hoặc sự kiện
                                </label>
                                <select
                                    id={eventSelectId}
                                    value={eventId}
                                    onChange={(e) => onEventIdChange?.(e.target.value)}
                                    className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">Tất cả chủ đề</option>
                                    <option value="general">Thảo luận chung</option>
                                    {taggableEvents.length > 0 && (
                                        <optgroup label="Theo sự kiện">
                                            {taggableEvents.map((ev) => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.name}
                                                    {ev.startAt
                                                        ? ` (${formatShortEventDate(ev.startAt)})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            Tìm kiếm
                        </button>

                        <button
                            type="button"
                            onClick={handleResetClick}
                            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            <RotateCcw size={15} aria-hidden="true" />
                            Đặt lại
                        </button>
                    </div>
                </div>

                {activeTab === "comments" && postIdFilter && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        <span className="truncate">
                            Đang lọc bình luận thuộc bài viết:{" "}
                            <strong className="font-semibold">{postIdFilter.title}</strong>
                        </span>
                        <button
                            type="button"
                            onClick={onClearPostFilter}
                            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-blue-700 hover:underline"
                        >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Bỏ lọc bài viết
                        </button>
                    </div>
                )}
            </form>
        </search>
    );
}


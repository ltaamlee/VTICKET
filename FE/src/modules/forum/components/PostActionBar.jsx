import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Repeat, Send, Check } from "lucide-react";
import { formatSocialCount } from "../utils/forumHelpers";

function PostActionBar({
    postId,
    shareUrl,
    reactions,
    commentCount = 0,
    repostCount = 0,
    disabled = false,
    size = "md",
    onReact,
    onCommentClick,
}) {
    const [copied, setCopied] = useState(false);

    // Kiểm tra xem người dùng đã thả tim chưa
    const isLiked = Boolean(reactions?.myReaction);
    const likeCount = reactions?.total ?? 0;

    const formattedLikes = formatSocialCount(likeCount);
    const formattedComments = formatSocialCount(commentCount);
    const formattedReposts = formatSocialCount(repostCount);

    const targetUrl = shareUrl || `${window.location.origin}/forum/${postId}`;

    const handleRepostOrShare = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(targetUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2200);
                return;
            } catch {
                // fallback below
            }
        }

        // Fallback copy
        const input = document.createElement("input");
        input.value = targetUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    const isSmall = size === "sm";
    const iconClass = isSmall ? "h-4.5 w-4.5" : "h-5 w-5";
    const buttonPadClass = isSmall ? "h-7 w-7" : "h-8 w-8";
    const gapClass = isSmall ? "gap-3 sm:gap-4" : "gap-4 sm:gap-6";

    return (
        <div className={`relative flex items-center ${gapClass} text-slate-600`}>
            {/* Nút TIM (Heart) - Đỏ tươi khi active, ẩn số khi = 0 */}
            <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReact?.("LIKE");
                }}
                aria-label={isLiked ? "Bỏ thích" : "Thích"}
                className="group inline-flex cursor-pointer items-center gap-1.5 py-1 text-xs font-medium transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className={`flex ${buttonPadClass} items-center justify-center rounded-full transition-colors group-hover:bg-red-50`}>
                    <Heart
                        className={`${iconClass} transition-colors ${isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-slate-600 group-hover:text-red-500"
                            }`}
                        aria-hidden="true"
                    />
                </span>
                {formattedLikes && (
                    <span
                        className={`tabular-nums font-semibold ${isLiked ? "text-red-500" : "text-slate-700"
                            }`}
                    >
                        {formattedLikes}
                    </span>
                )}
            </button>

            {/* Nút BÌNH LUẬN (Comment / Reply) - Ẩn số khi = 0 */}
            {onCommentClick ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCommentClick();
                    }}
                    aria-label="Bình luận / Trả lời"
                    className="group inline-flex cursor-pointer items-center gap-1.5 py-1 text-xs font-medium transition-transform active:scale-90"
                >
                    <span className={`flex ${buttonPadClass} items-center justify-center rounded-full transition-colors group-hover:bg-blue-50`}>
                        <MessageCircle
                            className={`${iconClass} text-slate-600 transition-colors group-hover:text-blue-600`}
                            aria-hidden="true"
                        />
                    </span>
                    {formattedComments && (
                        <span className="tabular-nums font-semibold text-slate-700">
                            {formattedComments}
                        </span>
                    )}
                </button>
            ) : (
                <Link
                    to={`/forum/${postId}#comments`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Xem bình luận"
                    className="group inline-flex items-center gap-1.5 py-1 text-xs font-medium transition-transform active:scale-90"
                >
                    <span className={`flex ${buttonPadClass} items-center justify-center rounded-full transition-colors group-hover:bg-blue-50`}>
                        <MessageCircle
                            className={`${iconClass} text-slate-600 transition-colors group-hover:text-blue-600`}
                            aria-hidden="true"
                        />
                    </span>
                    {formattedComments && (
                        <span className="tabular-nums font-semibold text-slate-700">
                            {formattedComments}
                        </span>
                    )}
                </Link>
            )}

            {/* Nút ĐĂNG LẠI (Repost / Share link) */}
            <button
                type="button"
                onClick={handleRepostOrShare}
                title="Đăng lại / Sao chép liên kết"
                aria-label="Đăng lại"
                className="group relative inline-flex cursor-pointer items-center gap-1.5 py-1 text-xs font-medium transition-transform active:scale-90"
            >
                <span className={`flex ${buttonPadClass} items-center justify-center rounded-full transition-colors group-hover:bg-emerald-50`}>
                    {copied ? (
                        <Check
                            className={`${iconClass} text-emerald-600`}
                            aria-hidden="true"
                        />
                    ) : (
                        <Repeat
                            className={`${iconClass} text-slate-600 transition-colors group-hover:text-emerald-600`}
                            aria-hidden="true"
                        />
                    )}
                </span>
                {formattedReposts && (
                    <span className="tabular-nums font-semibold text-slate-700">
                        {formattedReposts}
                    </span>
                )}

                {/* Toast tooltip nhỏ thông báo đã copy link */}
                {copied && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md z-10">
                        Đã sao chép liên kết!
                    </span>
                )}
            </button>

            {/* Nút CHIA SẺ (Send) */}
            <button
                type="button"
                onClick={handleRepostOrShare}
                title="Chia sẻ"
                aria-label="Chia sẻ"
                className="group inline-flex cursor-pointer items-center gap-1.5 py-1 text-xs font-medium transition-transform active:scale-90"
            >
                <span className={`flex ${buttonPadClass} items-center justify-center rounded-full transition-colors group-hover:bg-slate-100`}>
                    <Send
                        className={`${isSmall ? "h-4 w-4" : "h-4.5 w-4.5"} text-slate-600 transition-colors group-hover:text-slate-900`}
                        aria-hidden="true"
                    />
                </span>
            </button>
        </div>
    );
}

export default PostActionBar;

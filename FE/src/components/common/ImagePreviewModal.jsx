import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

/**
 * Reusable modal for zooming and previewing images.
 * @param {boolean} [isOpen] - Optional boolean controlling visibility.
 * @param {string|{url: string, title?: string}} src - Image URL or object containing url and title.
 * @param {string} [title] - Title displayed at the top of the modal.
 * @param {() => void} onClose - Callback when modal is closed.
 */
export default function ImagePreviewModal({ isOpen, src, title, onClose }) {
  const show = isOpen !== undefined ? isOpen : Boolean(src);

  const imageUrl = typeof src === "object" ? src?.url : src;
  const imageTitle = (typeof src === "object" ? src?.title : title) || "Xem ảnh tài liệu";

  // Handle ESC key to close
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  if (!show || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between w-full mb-3 px-2 text-white">
          <span className="text-sm font-semibold text-gray-200 truncate max-w-md">
            {imageTitle}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition backdrop-blur-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở tab mới</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition backdrop-blur-sm"
              title="Đóng (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <img
          src={imageUrl}
          alt={imageTitle}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 bg-black/30"
        />
      </div>
    </div>
  );
}

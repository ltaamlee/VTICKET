import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || "";

function GifPicker({ onSelect, onClose }) {
    const [query, setQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [customUrl, setCustomUrl] = useState("");

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setError("");
                const q = query.trim();

                let mapped = [];
                if (GIPHY_API_KEY) {
                    const endpoint = q
                        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`
                        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
                    const res = await fetch(endpoint);
                    if (!res.ok) throw new Error("Không thể tải GIF từ Giphy");
                    const json = await res.json();
                    mapped = (json?.data || [])
                        .map((item) => ({
                            id: item.id,
                            title: item.title || "GIF",
                            previewUrl: item.images?.fixed_width_small?.url || item.images?.fixed_width?.url,
                            url: item.images?.fixed_width?.url || item.images?.original?.url,
                        }))
                        .filter((item) => item.previewUrl && item.url);
                } else {
                    const endpoint = q
                        ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=LIVDSRZULELA&limit=20`
                        : `https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=20`;
                    const res = await fetch(endpoint);
                    if (!res.ok) throw new Error("Không thể tải GIF");
                    const json = await res.json();
                    mapped = (json?.results || [])
                        .map((item) => {
                            const media = item.media?.[0];
                            return {
                                id: item.id,
                                title: item.content_description || "GIF",
                                previewUrl: media?.tinygif?.url || media?.gif?.url,
                                url: media?.gif?.url || media?.tinygif?.url,
                            };
                        })
                        .filter((item) => item.previewUrl && item.url);
                }

                if (!cancelled) setGifs(mapped);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Không thể tải GIF");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const handleCustomSubmit = () => {
        const trimmed = customUrl.trim();
        if (!/^https?:\/\//i.test(trimmed)) return;
        onSelect?.(trimmed);
        onClose?.();
    };

    return (
        <div className="w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Chọn GIF</span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng chọn GIF"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="relative mb-2.5">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm GIF..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-blue-400 focus:bg-white"
                />
            </div>

            {loading ? (
                <div className="grid h-48 grid-cols-2 gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-22 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            ) : error ? (
                <p className="py-6 text-center text-xs text-red-500">{error}</p>
            ) : gifs.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Không tìm thấy GIF phù hợp</p>
            ) : (
                <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto">
                    {gifs.map((gif) => (
                        <button
                            key={gif.id}
                            type="button"
                            onClick={() => {
                                onSelect?.(gif.url);
                                onClose?.();
                            }}
                            className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50 transition-transform hover:scale-[1.02] cursor-pointer"
                        >
                            <img
                                src={gif.previewUrl}
                                alt={gif.title}
                                className="h-22 w-full object-cover"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-2.5 flex gap-1.5 border-t border-slate-100 pt-2">
                <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomSubmit();
                        }
                    }}
                    placeholder="Hoặc dán link .gif..."
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
                />
                <button
                    type="button"
                    onClick={handleCustomSubmit}
                    className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
                >
                    Chọn
                </button>
            </div>
        </div>
    );
}

export default GifPicker;

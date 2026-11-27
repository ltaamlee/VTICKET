import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, X } from "lucide-react";
import { getPosts } from "../services/forumService";

function ForumRightSearch() {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const trimmed = keyword.trim();

    useEffect(() => {
        if (!trimmed) {
            setResults([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await getPosts({ keyword: trimmed, limit: 8 });
                if (!cancelled) {
                    setResults(res?.data?.posts || res?.data?.items || []);
                }
            } catch {
                if (!cancelled) setResults([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [trimmed]);

    return (
        <aside
            aria-label="Tìm kiếm trên diễn đàn"
            className="hidden xl:block w-80 shrink-0 pr-6 py-6"
        >
            <div className="sticky top-20 space-y-4">
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm kiếm"
                        aria-label="Tìm kiếm tên người dùng, bài viết hoặc từ khóa"
                        className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 shadow-2xs outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
                    />
                    {keyword && (
                        <button
                            type="button"
                            onClick={() => setKeyword("")}
                            aria-label="Xóa từ khóa"
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {trimmed && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-700">
                                Bài viết liên quan
                            </p>
                        </div>

                        {loading ? (
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse space-y-1.5">
                                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                                        <div className="h-3 w-full rounded bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                        ) : results.length === 0 ? (
                            <p className="p-6 text-center text-xs text-slate-400">
                                Không tìm thấy bài viết nào cho "{trimmed}"
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
                                {results.map((post) => (
                                    <Link
                                        key={post.id}
                                        to={`/forum/${post.id}`}
                                        className="block px-4 py-3 transition-colors hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            {post.author?.avatar ? (
                                                <img
                                                    src={post.author.avatar}
                                                    alt=""
                                                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                                    <User className="h-3 w-3" />
                                                </div>
                                            )}
                                            <span className="truncate text-xs font-semibold text-slate-900">
                                                {post.author?.name || "Thành viên"}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                                            {post.excerpt || post.content}
                                        </p>
                                        {post.event?.name && (
                                            <p className="mt-1 truncate text-[11px] font-medium text-blue-600">
                                                {post.event.name}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default ForumRightSearch;


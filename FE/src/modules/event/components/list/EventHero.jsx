import { Search } from "lucide-react";

/**
 * EventHero - Banner đầu trang danh sách sự kiện kèm ô tìm kiếm nhanh
 */
export default function EventHero({ keyword, onKeywordChange, onSearchSubmit }) {
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSearchSubmit();
        }
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
            <div className="relative mx-auto max-w-5xl text-center">
                <div className="inline-flex items-center rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-400/30 mb-4">
                    Khám phá hàng ngàn sự kiện đặc sắc
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    Tìm kiếm & Trải nghiệm Sự kiện
                </h1>

                <p className="mt-3 text-sm text-blue-200 sm:text-base max-w-2xl mx-auto">
                    Âm nhạc, công nghệ, thể thao, hội thảo và các hoạt động giải trí hàng đầu đang chờ bạn.
                </p>

                {/* Thanh tìm kiếm nhanh */}
                <div className="mt-8 mx-auto max-w-2xl">
                    <div className="flex items-center rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
                        <div className="flex items-center gap-2 pl-3 flex-1 text-gray-400">
                            <Search className="h-5 w-5 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => onKeywordChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tìm theo tên sự kiện, nghệ sĩ, địa điểm..."
                                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={onSearchSubmit}
                            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition shrink-0 cursor-pointer"
                        >
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

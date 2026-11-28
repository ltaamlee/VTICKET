/**
 * EventSkeleton - Hiển thị khung chờ khi tải danh sách sự kiện
 */
export default function EventSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse"
                >
                    <div className="h-48 w-full bg-gray-200" />
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-gray-200 rounded-full" />
                            <div className="h-4 w-16 bg-gray-200 rounded-full" />
                        </div>
                        <div className="h-6 w-3/4 bg-gray-200 rounded-md" />
                        <div className="space-y-2 pt-2">
                            <div className="h-4 w-1/2 bg-gray-200 rounded-sm" />
                            <div className="h-4 w-2/3 bg-gray-200 rounded-sm" />
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="h-5 w-24 bg-gray-200 rounded-md" />
                            <div className="h-9 w-24 bg-gray-200 rounded-xl" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}


function Pagination({
    page = 1,
    totalPages = 1,
    onPageChange,
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500">
                Trang {page} / {totalPages}
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm
            hover:bg-gray-50 disabled:cursor-not-allowed
            disabled:opacity-40"
                >
                    Trước
                </button>

                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm
            hover:bg-gray-50 disabled:cursor-not-allowed
            disabled:opacity-40"
                >
                    Sau
                </button>
            </div>
        </div>
    );
}

export default Pagination;

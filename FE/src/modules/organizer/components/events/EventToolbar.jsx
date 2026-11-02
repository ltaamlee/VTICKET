import Button from "../../../../components/common/button/Button";
import SearchInput from "../../../../components/common/toolbar/SearchInput";

function EventToolbar({
    keyword,
    setKeyword,
    status,
    setStatus,
    onReset,
}) {
    return (
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                {/* Tìm kiếm sự kiện */}
                <SearchInput
                    value={keyword}
                    onChange={setKeyword}
                    placeholder="Tìm theo tên sự kiện..."
                />

                {/* Lọc trạng thái */}
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="COMPLETED">Đã kết thúc</option>
                </select>
            </div>

            {/* Đặt lại bộ lọc */}
            <Button
                type="button"
                variant="secondary"
                onClick={onReset}
            >
                Đặt lại
            </Button>
        </div>
    );
}

export default EventToolbar;
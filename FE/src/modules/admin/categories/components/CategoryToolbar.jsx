import Button from "../../../../components/common/button/Button";
import SearchInput from "../../../../components/common/toolbar/SearchInput";

function EventToolbar({
    keyword,
    setKeyword,
    onReset,
}) {
    return (
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-1">
                <SearchInput
                    value={keyword}
                    onChange={setKeyword}
                    placeholder="Tìm theo tên danh mục"
                />
            </div>

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
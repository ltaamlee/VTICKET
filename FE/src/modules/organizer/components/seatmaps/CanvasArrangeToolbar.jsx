import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignEndHorizontal,
    AlignEndVertical,
    AlignHorizontalDistributeCenter,
    AlignStartHorizontal,
    AlignStartVertical,
    AlignVerticalDistributeCenter,
    Blend,
    BringToFront,
    CircleSlash,
    Combine,
    Diff,
    FlipHorizontal2,
    FlipVertical2,
    Grid3x3,
    Group,
    Scissors,
    SendToBack,
    Ungroup,
} from "lucide-react";

/**
 * ============================================================
 * THANH CÔNG CỤ "COLLAGE"
 * ============================================================
 * Nhóm các thao tác sắp xếp & gom kết giống Penpot/Figma:
 *  - Gom nhóm / Bỏ nhóm (Group / Ungroup)
 *  - Gộp / Trừ / Giao / Loại trừ (Boolean operations) - gộp THẬT
 *    thành một khối liền mạch, không phải chỉ gom nhóm.
 *  - Tách khối (Split) - bung lại các thành phần đã gộp.
 *  - Căn lề 6 hướng (Align)
 *  - Phân bố đều (Distribute)
 *  - Thứ tự hiển thị (Bring to front / Send to back)
 *  - Lật gương (Flip)
 */

const toolClass =
    "flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40";

const labelClass =
    "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400";

export default function CanvasArrangeToolbar({
    selectedCount = 0,
    hasGroup = false,
    canSplit = false,
    canFitSeats = false,
    onGroup,
    onUngroup,
    onCombine,
    onSplit,
    onAlign,
    onDistribute,
    onReorder,
    onFlip,
    onFitSeats,
    onAlert,
}) {
    const hasMulti = selectedCount >= 2;

    /**
     * Báo lỗi khi thao tác cần nhiều hình mà mới chỉ chọn 1.
     * Thay vì ẩn/disable nút, ta báo rõ để người dùng biết phải
     * chọn thêm bao nhiêu khu vực.
     */
    const requireMulti = (minCount, actionName, e) => {
        e?.stopPropagation();

        onAlert?.(
            "error",
            `${actionName} cần chọn ít nhất ${minCount} khu vực (hiện đang chọn ${selectedCount}).`
        );
    };

    // Thanh công cụ LUÔN hiện khi mở canvas (mặc định), kể cả khi
    // chưa chọn hình nào - để người dùng luôn thấy được công cụ.
    return (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
            {/* Gom nhóm / Bỏ nhóm - luôn hiện, báo lỗi nếu chưa đủ điều kiện */}
            <div>
                <span className={labelClass}>Nhóm</span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            if (!hasMulti) {
                                requireMulti(2, "Gom nhóm", e);
                                return;
                            }

                            onGroup();
                        }}
                        title="Gom nhóm (Ctrl+G)"
                        className={toolClass}
                    >
                        <Group size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            if (!hasGroup) {
                                e?.stopPropagation();

                                onAlert?.(
                                    "error",
                                    "Bỏ nhóm: chưa có khu vực nào thuộc nhóm."
                                );

                                return;
                            }

                            onUngroup();
                        }}
                        title="Bỏ nhóm (Ctrl+Shift+G)"
                        className={toolClass}
                    >
                        <Ungroup size={14} />
                    </button>
                </div>

                {selectedCount > 0 && (
                    <span className="text-[11px] font-semibold text-blue-700">
                        {selectedCount === 1
                            ? "1 khu vực được chọn"
                            : `${selectedCount} khu vực được chọn`}
                    </span>
                )}
            </div>

            {/* Phép toán boolean - gộp thật thành khối liền mạch */}
            <div>
                <span className={labelClass}>Gộp hình</span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            if (!hasMulti) {
                                requireMulti(2, "Gộp hình", e);
                                return;
                            }

                            onCombine("UNION");
                        }}
                        title="Gộp lại thành một khối liền mạch (Ctrl+Shift+U)"
                        className={toolClass}
                    >
                        <Combine size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            if (!hasMulti) {
                                requireMulti(2, "Phép trừ", e);
                                return;
                            }

                            onCombine("DIFFERENCE");
                        }}
                        title="Trừ: hình đầu tiên trừ các hình còn lại"
                        className={toolClass}
                    >
                        <Diff size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            if (!hasMulti) {
                                requireMulti(2, "Phép giao", e);
                                return;
                            }

                            onCombine("INTERSECT");
                        }}
                        title="Giao: chỉ giữ phần chung của các hình"
                        className={toolClass}
                    >
                        <Blend size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            if (!hasMulti) {
                                requireMulti(2, "Phép loại trừ", e);
                                return;
                            }

                            onCombine("EXCLUDE");
                        }}
                        title="Loại trừ: giữ phần không thuộc hình nào"
                        className={toolClass}
                    >
                        <CircleSlash size={14} />
                    </button>
                </div>
            </div>

            {/* Tách khối đã gộp về lại các thành phần gốc */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={onSplit}
                    disabled={!canSplit}
                    title="Tách khối (Ctrl+Shift+S)"
                    className={toolClass}
                >
                    <Scissors size={14} />
                </button>
            </div>

            {/* Căn lề */}
            <div>
                <span className={labelClass}>Căn</span>

                <div className="flex items-center gap-1.5">
                    {[
                        {
                            icon: AlignStartVertical,
                            title: "Căn trái",
                            value: "left",
                        },
                        {
                            icon: AlignCenterVertical,
                            title: "Căn giữa ngang",
                            value: "center-h",
                        },
                        {
                            icon: AlignEndVertical,
                            title: "Căn phải",
                            value: "right",
                        },
                        {
                            icon: AlignStartHorizontal,
                            title: "Căn trên",
                            value: "top",
                        },
                        {
                            icon: AlignCenterHorizontal,
                            title: "Căn giữa dọc",
                            value: "center-v",
                        },
                        {
                            icon: AlignEndHorizontal,
                            title: "Căn dưới",
                            value: "bottom",
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={(e) => {
                                    if (selectedCount === 0) {
                                        onAlert?.(
                                            "error",
                                            `${item.title}: hãy chọn ít nhất một khu vực trên canvas.`
                                        );

                                        return;
                                    }

                                    onAlign(item.value);
                                }}
                                title={
                                    hasMulti
                                        ? `${item.title} (căn theo nhóm đang chọn)`
                                        : `${item.title} (căn theo canvas)`
                                }
                                className={toolClass}
                            >
                                <Icon size={14} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Phân bố */}
            <div>
                <span className={labelClass}>Phân bố</span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            if (selectedCount === 0) {
                                onAlert?.(
                                    "error",
                                    "Phân bố: hãy chọn ít nhất 3 khu vực trên canvas."
                                );

                                return;
                            }

                            if (selectedCount < 3) {
                                requireMulti(3, "Phân bố", e);
                                return;
                            }

                            onDistribute("horizontal");
                        }}
                        title="Phân bố đều ngang (cần ít nhất 3 khu vực)"
                        className={toolClass}
                    >
                        <AlignHorizontalDistributeCenter size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            if (selectedCount === 0) {
                                onAlert?.(
                                    "error",
                                    "Phân bố: hãy chọn ít nhất 3 khu vực trên canvas."
                                );

                                return;
                            }

                            if (selectedCount < 3) {
                                requireMulti(3, "Phân bố", e);
                                return;
                            }

                            onDistribute("vertical");
                        }}
                        title="Phân bố đều dọc (cần ít nhất 3 khu vực)"
                        className={toolClass}
                    >
                        <AlignVerticalDistributeCenter size={14} />
                    </button>
                </div>
            </div>

            {/* Căn chỉnh lại lưới ghế: ô vuông & bằng nhau */}
            <div>
                <span className={labelClass}>Lưới ghế</span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onFitSeats}
                        disabled={!canFitSeats}
                        title="Căn chỉnh lại lưới ghế: mọi ô vuông và bằng nhau"
                        className={toolClass}
                    >
                        <Grid3x3 size={14} />
                    </button>
                </div>
            </div>

            {/* Thứ tự hiển thị - áp dụng cho cả 1 hình lẫn nhiều hình */}
            <div>
                <span className={labelClass}>Lớp</span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => onReorder("front")}
                        title="Đưa lên trên cùng"
                        className={toolClass}
                    >
                        <BringToFront size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onReorder("back")}
                        title="Đưa xuống dưới cùng"
                        className={toolClass}
                    >
                        <SendToBack size={14} />
                    </button>
                </div>
            </div>

            {/* Lật gương - áp dụng cho cả 1 hình lẫn nhiều hình */}
            <div>
                <span className={labelClass}>Lật</span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => onFlip("horizontal")}
                        title="Lật ngang"
                        className={toolClass}
                    >
                        <FlipHorizontal2 size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onFlip("vertical")}
                        title="Lật dọc"
                        className={toolClass}
                    >
                        <FlipVertical2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

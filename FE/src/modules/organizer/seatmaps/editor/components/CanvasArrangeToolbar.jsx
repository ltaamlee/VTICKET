
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

// ============================================================
// CONSTANTS
// ============================================================

const TOOL_CLASS =
    "flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40";

const LABEL_CLASS =
    "mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400";

const ALIGN_TOOLS = [
    { icon: AlignStartVertical, title: "Căn trái", value: "left" },
    { icon: AlignCenterVertical, title: "Căn giữa ngang", value: "center-h" },
    { icon: AlignEndVertical, title: "Căn phải", value: "right" },
    { icon: AlignStartHorizontal, title: "Căn trên", value: "top" },
    { icon: AlignCenterHorizontal, title: "Căn giữa dọc", value: "center-v" },
    { icon: AlignEndHorizontal, title: "Căn dưới", value: "bottom" },
];

const BOOLEAN_TOOLS = [
    {
        icon: Combine,
        title: "Gộp hình (Union)",
        value: "UNION",
    },
    {
        icon: Diff,
        title: "Phép trừ (Difference)",
        value: "DIFFERENCE",
    },
    {
        icon: Blend,
        title: "Phép giao (Intersect)",
        value: "INTERSECT",
    },
    {
        icon: CircleSlash,
        title: "Phép loại trừ (Exclude)",
        value: "EXCLUDE",
    },
];

const DISTRIBUTE_TOOLS = [
    {
        icon: AlignHorizontalDistributeCenter,
        title: "Phân bố đều ngang",
        value: "horizontal",
    },
    {
        icon: AlignVerticalDistributeCenter,
        title: "Phân bố đều dọc",
        value: "vertical",
    },
];

const LAYER_TOOLS = [
    { icon: BringToFront, title: "Đưa lên trên cùng", value: "front" },
    { icon: SendToBack, title: "Đưa xuống dưới cùng", value: "back" },
];

const FLIP_TOOLS = [
    { icon: FlipHorizontal2, title: "Lật ngang", value: "horizontal" },
    { icon: FlipVertical2, title: "Lật dọc", value: "vertical" },
];

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function ToolButton({
    icon: Icon,
    title,
    onClick,
    disabled = false,
}) {
    return (
        <button
            type="button"
            aria-label={title}
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={TOOL_CLASS}
        >
            <Icon size={15} strokeWidth={1.8} />
        </button>
    );
}

function ToolSection({ title, children, className = "" }) {
    return (
        <div className={className}>
            <span className={LABEL_CLASS}>{title}</span>
            <div className="flex items-center gap-1">
                {children}
            </div>
        </div>
    );
}

function ToolGroup({
    items,
    onAction,
    disabled = false,
}) {
    return items.map(({ icon, title, value }) => (
        <ToolButton
            key={value}
            icon={icon}
            title={title}
            disabled={disabled}
            onClick={() => onAction?.(value)}
        />
    ));
}

// ============================================================
// MAIN COMPONENT
// ============================================================

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

    // --------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------

    const alertError = (message) => {
        onAlert?.("error", message);
    };

    const requireSelection = (
        minCount,
        actionName,
        message,
    ) => {
        if (selectedCount >= minCount) return true;

        alertError(
            message ||
            `${actionName} cần chọn ít nhất ${minCount} khu vực (hiện đang chọn ${selectedCount}).`
        );

        return false;
    };

    const handleGroup = () => {
        if (!requireSelection(2, "Gom nhóm")) return;
        onGroup?.();
    };

    const handleUngroup = () => {
        if (!hasGroup) {
            alertError("Bỏ nhóm: chưa có khu vực nào thuộc nhóm.");
            return;
        }

        onUngroup?.();
    };

    const handleCombine = (operation) => {
        if (!requireSelection(2, "Gộp hình")) return;
        onCombine?.(operation);
    };

    const handleAlign = (direction) => {
        if (selectedCount === 0) {
            alertError(
                "Căn chỉnh: hãy chọn ít nhất một khu vực trên canvas."
            );
            return;
        }

        onAlign?.(direction);
    };

    const handleDistribute = (direction) => {
        if (!requireSelection(
            3,
            "Phân bố",
            "Phân bố: hãy chọn ít nhất 3 khu vực trên canvas."
        )) return;

        onDistribute?.(direction);
    };

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl px-3 py-2.5">

            {/* GROUP */}
            <ToolSection title="Nhóm">
                <ToolButton
                    icon={Group}
                    title="Gom nhóm (Ctrl+G)"
                    onClick={handleGroup}
                />

                <ToolButton
                    icon={Ungroup}
                    title="Bỏ nhóm (Ctrl+Shift+G)"
                    onClick={handleUngroup}
                />

                {selectedCount > 0 && (
                    <span className="ml-1 whitespace-nowrap text-[11px] font-medium text-blue-700">
                        {selectedCount} đã chọn
                    </span>
                )}
            </ToolSection>

            {/* BOOLEAN */}
            <ToolSection title="Gộp hình">
                <ToolGroup
                    items={BOOLEAN_TOOLS}
                    onAction={handleCombine}
                />
            </ToolSection>

            {/* SPLIT */}
            <ToolSection title="Tách">
                <ToolButton
                    icon={Scissors}
                    title="Tách khối (Ctrl+Shift+S)"
                    disabled={!canSplit}
                    onClick={onSplit}
                />
            </ToolSection>

            {/* ALIGN */}
            <ToolSection title="Căn chỉnh">
                <ToolGroup
                    items={ALIGN_TOOLS}
                    onAction={handleAlign}
                />
            </ToolSection>

            {/* DISTRIBUTE */}
            <ToolSection title="Phân bố">
                <ToolGroup
                    items={DISTRIBUTE_TOOLS}
                    onAction={handleDistribute}
                />
            </ToolSection>

            {/* FIT SEATS */}
            <ToolSection title="Lưới ghế">
                <ToolButton
                    icon={Grid3x3}
                    title="Căn chỉnh lưới ghế: ô vuông và bằng nhau"
                    disabled={!canFitSeats}
                    onClick={onFitSeats}
                />
            </ToolSection>

            {/* LAYER */}
            <ToolSection title="Thứ tự lớp">
                <ToolGroup
                    items={LAYER_TOOLS}
                    onAction={onReorder}
                />
            </ToolSection>

            {/* FLIP */}
            <ToolSection title="Lật">
                <ToolGroup
                    items={FLIP_TOOLS}
                    onAction={onFlip}
                />
            </ToolSection>
        </div>
    );
}
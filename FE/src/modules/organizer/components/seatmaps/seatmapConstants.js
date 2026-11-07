/**
 * Các hằng số dùng chung cho trình chỉnh sửa sơ đồ ghế.
 */

export const GRID_SIZE = 20;

export const DEFAULT_CANVAS_WIDTH = 900;
export const DEFAULT_CANVAS_HEIGHT = 600;

export const DEFAULT_SHAPE = "RECTANGLE";

export const ZONE_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
];

export const ZONE_TYPES = [
    {
        value: "SEATED",
        label: "Ghế ngồi",
        description: "Khu vực có chỗ ngồi",
    },
    {
        value: "STANDING",
        label: "Khu vực đứng",
        description: "Khu vực khán đài đứng",
    },
    {
        value: "STAGE",
        label: "Sân khấu",
        description: "Khu vực biểu diễn, không có ghế",
    },
];

export const ZONE_TYPE_LABEL = {
    SEATED: "Ghế ngồi",
    STANDING: "Đứng",
    STAGE: "Sân khấu",
};

// Kích thước gợi ý khi đổi hình dạng.
export const SHAPE_SIZE_HINT = {
    RECTANGLE: { width: 160, height: 110 },
    ROUNDED: { width: 160, height: 110 },
    CIRCLE: { width: 140, height: 140 },
    ELLIPSE: { width: 180, height: 120 },
    TRIANGLE: { width: 180, height: 130 },
    DIAMOND: { width: 160, height: 140 },
    TRAPEZOID: { width: 180, height: 120 },
    POLYGON: { width: 160, height: 140 },
};

// Kích thước gợi ý cho từng mẫu đa giác dựng sẵn (chữ T, U, L...).
export const PRESET_SIZE_HINT = {
    HEXAGON: { width: 160, height: 140 },
    LETTER_T: { width: 200, height: 140 },
    LETTER_U: { width: 180, height: 140 },
    LETTER_L: { width: 160, height: 140 },
};

// Kích thước mặc định theo loại khu vực.
export const TYPE_SIZE_HINT = {
    SEATED: { width: 160, height: 110 },
    STANDING: { width: 140, height: 90 },
    STAGE: { width: 200, height: 70 },
};

export const MIN_ZONE_SIZE = 40;

/** Dính toạ độ vào lưới. */
export function snapToGrid(value, grid = GRID_SIZE) {
    return Math.round(Number(value) / grid) * grid;
}

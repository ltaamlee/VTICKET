
const {
    convertSeatKeys,
} = require("../../../utils/seatNumbering");

const BaseService = require("../../public/base.service");

const ZONE_TYPE_VALUES = ["SEATED", "STANDING", "STAGE"];

const ZONE_SHAPE_VALUES = [ "RECTANGLE", "ROUNDED", "CIRCLE", "ELLIPSE", "TRIANGLE", "DIAMOND", "TRAPEZOID", "POLYGON", ];

const DEFAULT_CANVAS_WIDTH = 900;
const DEFAULT_CANVAS_HEIGHT = 600;
const MAX_CANVAS_SIZE = 4000;

class SeatMapValidationService extends BaseService {
    isValidId(id) {
        return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
    }

    normalizeNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    normalizeCanvas(canvasWidth, canvasHeight) {
        const width = Math.min( Math.max( this.normalizeNumber(canvasWidth, DEFAULT_CANVAS_WIDTH), 320 ), MAX_CANVAS_SIZE );
        const height = Math.min( Math.max( this.normalizeNumber(canvasHeight, DEFAULT_CANVAS_HEIGHT), 320 ), MAX_CANVAS_SIZE );

        return { width, height };
    }

    normalizeSeatKeys(keys) {
        if (!Array.isArray(keys)) return [];

        const cleaned = convertSeatKeys(keys).filter(
            (key) => typeof key === "string" && key.includes("|")
        );

        return [...new Set(cleaned)];
    }

    normalizeZones(zones) {
        if (!Array.isArray(zones) || zones.length === 0) {
            this.throwError("Sơ đồ ghế cần ít nhất một khu vực");
        }

        return zones.map((zone, index) => {
            const name = typeof zone?.name === "string"
                ? zone.name.trim()
                : "";

            if (!name) {
                this.throwError(`Khu vực thứ ${index + 1} cần có tên`);
            }

            const type = ZONE_TYPE_VALUES.includes(zone?.type)
                ? zone.type
                : "SEATED";

            // Chỉ SEATED mới sử dụng cấu hình hàng và ghế.
            const rowCount = type === "SEATED"
                ? Math.floor(this.normalizeNumber(zone?.rowCount))
                : 0;

            const seatPerRow = type === "SEATED"
                ? Math.floor(this.normalizeNumber(zone?.seatPerRow))
                : 0;

            if (rowCount < 0 || seatPerRow < 0) {
                this.throwError(`Khu vực "${name}" có số lượng không hợp lệ`);
            }

            if (type === "SEATED" && (rowCount < 1 || seatPerRow < 1)) {
                this.throwError(`Khu vực "${name}" cần ít nhất một hàng và một ghế`);
            }

            const shape = ZONE_SHAPE_VALUES.includes(zone?.shape)
                ? zone.shape
                : "RECTANGLE";

            const removedSeats = type === "SEATED"
                ? this.normalizeSeatKeys(zone?.removedSeats)
                : [];

            const blockedSeats = type === "SEATED"
                ? this.normalizeSeatKeys(zone?.blockedSeats)
                : [];

            // Xử lý hình đa giác.
            let points = null;

            if (Array.isArray(zone?.points)) {
                const parsed = zone.points
                    .map((point) => ({
                        x: Number(point?.x),
                        y: Number(point?.y),
                    }))
                    .filter(
                        (point) =>
                            Number.isFinite(point.x) &&
                            Number.isFinite(point.y)
                    );

                if (parsed.length >= 3) points = parsed;
            }

            let holes = null;

            if (Array.isArray(zone?.holes)) {
                const parsedHoles = zone.holes
                    .map((ring) =>
                        (Array.isArray(ring) ? ring : [])
                            .map((point) => ({
                                x: Number(point?.x),
                                y: Number(point?.y),
                            }))
                            .filter(
                                (point) =>
                                    Number.isFinite(point.x) &&
                                    Number.isFinite(point.y)
                            )
                    )
                    .filter((ring) => ring.length >= 3);

                if (parsedHoles.length > 0) holes = parsedHoles;
            }

            const originParts = Array.isArray(zone?.originParts)
                ? zone.originParts.filter(
                    (part) => part && typeof part === "object"
                )
                : null;

            // Chỉ SEATED mới có danh sách ghế.
            const seats = type === "SEATED" && Array.isArray(zone?.seats)
                ? zone.seats
                : [];

            // Kiểm tra ghế trùng.
            const seatKeys = new Set();

            for (const seat of seats) {
                const rowLabel = typeof seat?.rowLabel === "string"
                    ? seat.rowLabel.trim()
                    : "";

                const seatNumber =
                    typeof seat?.seatNumber === "string" ||
                        typeof seat?.seatNumber === "number"
                        ? String(seat.seatNumber).trim()
                        : "";

                if (!rowLabel || !seatNumber) {
                    this.throwError(
                        `Ghế trong khu vực "${name}" thiếu thông tin hàng hoặc số ghế`
                    );
                }

                const key = `${rowLabel}|${seatNumber}`;

                if (seatKeys.has(key)) {
                    this.throwError(
                        `Ghế ${key} bị trùng trong khu vực "${name}"`
                    );
                }

                seatKeys.add(key);
            }

            // Tính sức chứa Zone.
            let capacity = 0;

            if (type === "STANDING") {
                capacity = Math.max(
                    0,
                    Math.floor(this.normalizeNumber(zone?.capacity))
                );

                if (capacity < 1) {
                    this.throwError(
                        `Khu vực đứng "${name}" cần có sức chứa lớn hơn 0`
                    );
                }
            }

            if (type === "SEATED") {
                const totalSeats = seats.length > 0
                    ? seats.length
                    : rowCount * seatPerRow;

                const removedCount = seats.length > 0
                    ? 0
                    : removedSeats.length;

                const blockedCount = seats.length > 0
                    ? seats.filter(
                        (seat) =>
                            seat?.status === "BLOCKED" ||
                            blockedSeats.includes(
                                `${String(seat.rowLabel).trim()}|${String(seat.seatNumber).trim()}`
                            )
                    ).length
                    : blockedSeats.filter(
                        (key) => !removedSeats.includes(key)
                    ).length;

                capacity = Math.max(
                    0,
                    totalSeats - removedCount - blockedCount
                );
            }

            return {
                name,
                code: typeof zone?.code === "string" && zone.code.trim()
                    ? zone.code.trim()
                    : null,

                color: typeof zone?.color === "string" && zone.color.trim()
                    ? zone.color.trim()
                    : null,

                type,
                shape,

                price: type === "STAGE"
                    ? 0
                    : Math.max(0, this.normalizeNumber(zone?.price)),

                rowCount,
                seatPerRow,
                capacity,

                posX: this.normalizeNumber(zone?.posX),
                posY: this.normalizeNumber(zone?.posY),

                width: Math.max(
                    1,
                    this.normalizeNumber(zone?.width, 120)
                ),

                height: Math.max(
                    1,
                    this.normalizeNumber(zone?.height, 60)
                ),

                rotation: this.normalizeNumber(zone?.rotation),

                points,
                holes,
                originParts,

                removedSeats,
                blockedSeats,

                seatNumbering:
                    type === "SEATED" && zone?.seatNumbering === "COLUMN"
                        ? "COLUMN"
                        : "ROW",

                combineGroupId:
                    typeof zone?.combineGroupId === "string" &&
                        zone.combineGroupId.trim()
                        ? zone.combineGroupId.trim()
                        : null,

                groupId:
                    typeof zone?.groupId === "string" && zone.groupId.trim()
                        ? zone.groupId.trim()
                        : null,

                zIndex: Number.isFinite(Number(zone?.zIndex))
                    ? Math.round(Number(zone.zIndex))
                    : index,

                flipX: zone?.flipX === true,
                flipY: zone?.flipY === true,
                isLocked: zone?.isLocked === true,

                level: Math.max(
                    1,
                    Math.floor(this.normalizeNumber(zone?.level, 1))
                ),

                seats,
            };
        });
    }
}

module.exports = new SeatMapValidationService();
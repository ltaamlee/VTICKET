
const { getRowOrder, rowLabelToLetters, sortSeatsByNumbering, } = require("../../../utils/seatNumbering");

const seatMapValidationService = require("./seatMapValidation.service");

const SEAT_TYPE_VALUES = ["STANDARD", "VIP", "WHEELCHAIR"];

class SeatMapBuilderService {
    // Sinh danh sách ghế cho một Zone.
    buildSeats(zone, zoneIndex = 0) {
        if (zone.type !== "SEATED") return [];

        const seats = [];

        const removedSeats = new Set(
            seatMapValidationService.normalizeSeatKeys(zone.removedSeats)
        );

        const blockedSeats = new Set(
            seatMapValidationService.normalizeSeatKeys(zone.blockedSeats)
        );

        const direction =
            zone.seatNumbering === "COLUMN" ? "COLUMN" : "ROW";

        if (zone.seats && zone.seats.length > 0) {
            zone.seats.forEach((seat) => {
                const rowLabel = String(seat.rowLabel).trim();
                const seatNumber = String(seat.seatNumber).trim();
                const key = `${rowLabel}|${seatNumber}`;

                if (removedSeats.has(key)) return;

                seats.push({
                    rowLabel,
                    seatNumber,
                    type: SEAT_TYPE_VALUES.includes(seat.type)
                        ? seat.type
                        : "STANDARD",
                    status:
                        seat.status === "BLOCKED" || blockedSeats.has(key)
                            ? "BLOCKED"
                            : "AVAILABLE",
                    posX: seatMapValidationService.normalizeNumber(seat.posX),
                    posY: seatMapValidationService.normalizeNumber(seat.posY),
                });
            });
        } else {
            // Tự sinh ghế theo số hàng và số ghế mỗi hàng.
            for (let row = 1; row <= zone.rowCount; row += 1) {
                const rowLabel = rowLabelToLetters(row);

                for (
                    let seatNumber = 1;
                    seatNumber <= zone.seatPerRow;
                    seatNumber += 1
                ) {
                    const key = `${rowLabel}|${seatNumber}`;

                    if (removedSeats.has(key)) continue;

                    seats.push({
                        rowLabel,
                        seatNumber: String(seatNumber),
                        type: "STANDARD",
                        status: blockedSeats.has(key)
                            ? "BLOCKED"
                            : "AVAILABLE",
                        posX: 0,
                        posY: 0,
                    });
                }
            }
        }

        const sorted = sortSeatsByNumbering(seats, direction);

        // Tính kích thước ô ghế theo lưới và canh giữa trong Zone.
        const rows = Math.max(0, zone.rowCount || 0);
        const cols = Math.max(0, zone.seatPerRow || 0);

        const cell =
            rows === 0 || cols === 0
                ? 0
                : Math.max(
                      1,
                      Math.floor(
                          Math.min(
                              (zone.width || 0) / cols,
                              (zone.height || 0) / rows
                          )
                      )
                  );

        const originX =
            cols === 0 || cell === 0
                ? 0
                : Math.round(((zone.width || 0) - cell * cols) / 2);

        const originY =
            rows === 0 || cell === 0
                ? 0
                : Math.round(((zone.height || 0) - cell * rows) / 2);

        return sorted.map((seat, index) => {
            const rowNumber = getRowOrder(seat.rowLabel);
            const colNumber = Number(seat.seatNumber) || 0;
            const hasPosition =
                rowNumber > 0 && colNumber > 0 && cell > 0;

            return {
                ...seat,
                posX: hasPosition
                    ? originX + (colNumber - 1) * cell
                    : seat.posX || 0,
                posY: hasPosition
                    ? originY + (rowNumber - 1) * cell
                    : seat.posY || 0,
                order: zoneIndex * 10000 + index,
            };
        });
    }

    // Chuẩn bị dữ liệu Zone để tạo hoặc cập nhật trong database.
    buildZoneData(zone) {
        return {
            name: zone.name,
            code: zone.code,
            color: zone.color,
            type: zone.type,
            shape: zone.shape,
            price: zone.price,
            rowCount: zone.rowCount,
            seatPerRow: zone.seatPerRow,
            capacity: zone.capacity,
            posX: zone.posX,
            posY: zone.posY,
            width: zone.width,
            height: zone.height,
            rotation: zone.rotation,
            level: zone.level,
            points: zone.points ?? undefined,
            holes: zone.holes ?? undefined,
            originParts: zone.originParts ?? undefined,
            removedSeats:
                zone.removedSeats.length > 0
                    ? zone.removedSeats
                    : undefined,
            blockedSeats:
                zone.blockedSeats.length > 0
                    ? zone.blockedSeats
                    : undefined,
            seatNumbering: zone.seatNumbering,
            combineGroupId: zone.combineGroupId,
            groupId: zone.groupId,
            zIndex: zone.zIndex,
            flipX: zone.flipX,
            flipY: zone.flipY,
            isLocked: zone.isLocked === true,
        };
    }

    // Chuẩn bị dữ liệu Seat theo cấu trúc nested create của Prisma.
    buildSeatCreateData(zone, zoneIndex = 0) {
        return {
            create: this.buildSeats(zone, zoneIndex).map((seat) => ({
                rowLabel: seat.rowLabel,
                seatNumber: seat.seatNumber,
                type: seat.type,
                status: seat.status,
                posX: seat.posX,
                posY: seat.posY,
                order: seat.order,
            })),
        };
    }
}

module.exports = new SeatMapBuilderService();
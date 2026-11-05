/**
 * Migrate dữ liệu ghế cũ sang cách đánh số mới:
 *  - Seat.rowLabel: "1", "2", ... -> "A", "B", ...
 *  - Zone.removedSeats / Zone.blockedSeats: "1|3" -> "A|3"
 *  - Gán Seat.order theo chiều đánh số của zone (ROW / COLUMN).
 *
 * Chạy 1 lần: node scripts/migrateSeatLabels.js
 */

const prisma = require("../src/config/prisma");
const {
    convertSeatKeys,
    rowLabelToLetters,
    sortSeatsByNumbering,
} = require("../src/utils/seatNumbering");

async function main() {
    const zones = await prisma.zone.findMany({
        include: { seats: true },
    });

    console.log(`Tìm thấy ${zones.length} khu vực.`);

    let updatedZones = 0;
    let updatedSeats = 0;

    for (const zone of zones) {
        // 1. Chuẩn hóa khoá ô xoá / khoá.
        const removedSeats = convertSeatKeys(zone.removedSeats);
        const blockedSeats = convertSeatKeys(zone.blockedSeats);

        const removedChanged =
            JSON.stringify(removedSeats) !==
            JSON.stringify(zone.removedSeats || []);
        const blockedChanged =
            JSON.stringify(blockedSeats) !==
            JSON.stringify(zone.blockedSeats || []);

        // 2. Đổi rowLabel của ghế sang chữ cái.
        const seats = zone.seats.map((seat) => {
            const rowLabel = String(seat.rowLabel ?? "").trim();

            // Hàng đã là chữ cái -> giữ nguyên.
            if (/^[A-Za-z]+$/.test(rowLabel)) {
                return { ...seat, rowLabel };
            }

            const rowNumber = Number(rowLabel);

            if (!Number.isFinite(rowNumber) || rowNumber < 1) {
                return { ...seat, rowLabel };
            }

            return {
                ...seat,
                rowLabel: rowLabelToLetters(rowNumber),
            };
        });

        // 3. Gán order theo chiều đánh số.
        const direction = zone.seatNumbering === "COLUMN" ? "COLUMN" : "ROW";

        const ordered = sortSeatsByNumbering(seats, direction);

        ordered.forEach((seat, index) => {
            const nextOrder = index + 1;

            if (Number(seat.order) !== nextOrder) {
                prisma.seat
                    .update({
                        where: { id: seat.id },
                        data: {
                            rowLabel: seat.rowLabel,
                            order: nextOrder,
                        },
                    })
                    .then(() => {
                        updatedSeats += 1;
                    })
                    .catch((error) => {
                        console.error(
                            `  ! Lỗi cập nhật ghế ${seat.id}:`,
                            error.message
                        );
                    });
            }
        });

        // 4. Lưu khoá đã convert + seatNumbering mặc định.
        if (removedChanged || blockedChanged) {
            await prisma.zone.update({
                where: { id: zone.id },
                data: {
                    removedSeats,
                    blockedSeats,
                },
            });

            updatedZones += 1;
        }
    }

    // Chờ các update ghế hoàn tất.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(
        `Đã cập nhật ${updatedSeats} ghế và ${updatedZones} khu vực.`
    );
}

main()
    .catch((error) => {
        console.error("Lỗi migrate:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

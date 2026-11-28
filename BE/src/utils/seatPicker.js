const { getRowOrder, sortSeatsByNumbering } = require("./seatNumbering");

function areAdjacent(first, second, direction) {
    const firstRow = getRowOrder(first.rowLabel);
    const secondRow = getRowOrder(second.rowLabel);
    const firstColumn = Number(first.seatNumber);
    const secondColumn = Number(second.seatNumber);
    if (!firstRow || !secondRow || !Number.isInteger(firstColumn) || !Number.isInteger(secondColumn)) {
        return false;
    }
    return direction === "COLUMN"
        ? firstColumn === secondColumn && secondRow === firstRow + 1
        : firstRow === secondRow && secondColumn === firstColumn + 1;
}

function pickSeats(seats, count, direction = "ROW") {
    const sorted = sortSeatsByNumbering(seats, direction);
    if (!Number.isSafeInteger(count) || count < 1 || sorted.length < count) return [];

    const clusters = [];
    for (const seat of sorted) {
        const cluster = clusters[clusters.length - 1];
        if (cluster && areAdjacent(cluster[cluster.length - 1], seat, direction)) {
            cluster.push(seat);
        } else {
            clusters.push([seat]);
        }
    }
    const adjacent = clusters.find((cluster) => cluster.length >= count);
    return adjacent ? adjacent.slice(0, count) : clusters.flat().slice(0, count);
}

module.exports = { pickSeats };

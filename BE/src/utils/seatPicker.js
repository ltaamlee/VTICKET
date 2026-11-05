/**
 * ============================================================
 * TRẢ GHẾ NGẪU NHIÊN
 * ============================================================
 * Khi khách mua N vé, hệ thống cần trả N ghế:
 *  - ngẫu nhiên (không bán trúng chỗ đã có người ngồi)
 *  - nhưng các ghế được trả phải LIỀN KỀ nhau, để khách ngồi
 *    cạnh nhau và hạn chế sai sót khi tìm chỗ.
 *
 * Cách hoạt động:
 *  1. Ghế được sắp xếp sẵn theo "order" (chiều ROW hoặc COLUMN
 *     do khu vực quy định) -> ghế có order liên tiếp là ghế gần nhau.
 *  2. Chia danh sách thành các nhóm liên tiếp (mỗi nhóm = 1 "cụm"
 *     gồm nhiều ghế cạnh nhau).
 *  3. Xáo trộn ngẫu nhiên các cụm, rồi lấy đủ N ghế từ các cụm đầu.
 *
 * Ví dụ (theo hàng: A1 A2 A3 | A4 A5 | B1 B2 ...):
 *  mua 2 vé -> có thể ra (A2, A3) ho���c (A4, A5) - luôn cạnh nhau.
 */

/**
 * Chia danh sách ghế (đã sort theo order) thành các cụm liên tiếp.
 *
 * @param {Array} seats  Ghế có { order }.
 * @param {number} size  Kích thước cụm tối đa.
 * @returns {Array<Array>} Danh sách cụm.
 */
function buildSeatClusters(seats, size = 4) {
    const sorted = [...(seats || [])].sort(
        (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
    );

    const clusterSize = Math.max(1, Number(size) || 4);

    const clusters = [];

    for (let i = 0; i < sorted.length; i += clusterSize) {
        clusters.push(sorted.slice(i, i + clusterSize));
    }

    return clusters;
}

/**
 * Xáo trộn mảng (Fisher-Yates).
 */
function shuffle(list) {
    const result = [...list];

    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

/**
 * Trả N ghế ngẫu nhiên nhưng luôn liền kề.
 *
 * @param {Array} seats  Ghế khả dụng (đã lọc AVAILABLE).
 * @param {number} count Số ghế cần trả.
 * @param {object} options
 * @param {number} [options.clusterSize=4]  Số ghế tối đa trong 1 cụm.
 * @param {boolean} [options.keepTogether=true]  Giữ các ghế liền kề
 *        trong cùng nhóm (khi mua nhiều vé).
 * @returns {Array} Danh sách ghế được chọn.
 */
function pickSeats(seats, count, { clusterSize = 4, keepTogether = true } = {}) {
    const available = Array.isArray(seats) ? seats : [];

    const wanted = Math.max(0, Math.min(Number(count) || 0, available.length));

    if (wanted === 0) return [];

    // Không cần giữ liền kề -> chọn ngẫu nhiên thuần.
    if (!keepTogether) {
        return shuffle(available).slice(0, wanted);
    }

    const clusters = buildSeatClusters(available, clusterSize);

    // Xáo trộn các cụm -> mỗi lần mua ra một vùng khác nhau.
    const shuffledClusters = shuffle(clusters);

    const picked = [];

    for (const cluster of shuffledClusters) {
        if (picked.length >= wanted) break;

        picked.push(...cluster);
    }

    // Nếu các cụm không đủ ghế -> bù thêm từ những ghế còn lại.
    if (picked.length < wanted) {
        const pickedIds = new Set(picked.map((seat) => seat.id));

        const rest = shuffle(
            available.filter((seat) => !pickedIds.has(seat.id))
        );

        picked.push(...rest.slice(0, wanted - picked.length));
    }

    return picked.slice(0, wanted);
}

module.exports = {
    buildSeatClusters,
    shuffle,
    pickSeats,
};

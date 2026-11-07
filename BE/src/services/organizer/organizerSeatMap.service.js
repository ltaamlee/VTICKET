
const prisma = require("../../config/prisma");

const { convertSeatKeys, getRowOrder, rowLabelToLetters, sortSeatsByNumbering } = require("../../utils/seatNumbering");

const SEAT_TYPE_VALUES = ["STANDARD", "VIP", "WHEELCHAIR"];
const ZONE_TYPE_VALUES = ["SEATED", "STANDING", "STAGE"];
const ZONE_SHAPE_VALUES = ["RECTANGLE", "ROUNDED", "CIRCLE", "ELLIPSE", "TRIANGLE", "DIAMOND", "TRAPEZOID", "POLYGON"];
const SEAT_MAP_STATUS_VALUES = ["DRAFT", "READY", "ARCHIVED"];

const DEFAULT_CANVAS_WIDTH = 900;
const DEFAULT_CANVAS_HEIGHT = 600;
const MAX_CANVAS_SIZE = 4000;

class OrganizerSeatMapService {
    throwError(message, statusCode = 400) {
        const error = new Error(message);
        error.statusCode = statusCode;
        throw error;
    }

    validateOrganizer(organizerId) {
        if (!organizerId) {
            this.throwError("Không xác định được tài khoản Ban tổ chức", 401);
        }
    }

    isValidId(id) {
        return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
    }

    normalizeNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    normalizeCanvas(canvasWidth, canvasHeight) {
        const width = Math.min(Math.max(this.normalizeNumber(canvasWidth, DEFAULT_CANVAS_WIDTH), 320), MAX_CANVAS_SIZE);
        const height = Math.min(Math.max(this.normalizeNumber(canvasHeight, DEFAULT_CANVAS_HEIGHT), 320), MAX_CANVAS_SIZE);

        return { width, height };
    }

    normalizeSeatKeys(keys) {
        if (!Array.isArray(keys)) return [];

        const cleaned = convertSeatKeys(keys).filter(
            (key) => typeof key === "string" && key.includes("|")
        );

        return [...new Set(cleaned)];
    }

    async getSeatMaps({ organizerId, keyword = "" }) {
        this.validateOrganizer(organizerId);

        const searchKeyword = typeof keyword === "string" ? keyword.trim() : "";
        const where = { organizerId };

        if (searchKeyword) {
            where.name = {
                contains: searchKeyword,
                mode: "insensitive",
            };
        }

        const seatMaps = await prisma.seatMap.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            include: {
                zones: {
                    orderBy: [{ zIndex: "asc" }, { createdAt: "asc" }],
                    include: {
                        _count: {
                            select: { seats: true },
                        },
                    },
                },
                events: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });

        return seatMaps.map((seatMap) => ({
            ...seatMap,
            event: seatMap.events[0] || null,
            zoneCount: seatMap.zones.length,
            seatCount: seatMap.zones.reduce((total, zone) => total + zone._count.seats, 0),
            capacity: seatMap.zones.reduce(
                (total, zone) => total + (zone.type === "STAGE" ? 0 : zone.capacity || 0),
                0
            ),
            zones: seatMap.zones.map((zone) => ({
                ...zone,
                isLocked: zone.isLocked === true,
                seatCount: zone._count.seats,
            })),
        }));
    }

    async getSeatMapDetail({ seatMapId, organizerId }) {
        this.validateOrganizer(organizerId);

        if (!this.isValidId(seatMapId)) {
            this.throwError("ID sơ đồ ghế không hợp lệ");
        }

        const seatMap = await prisma.seatMap.findFirst({
            where: { id: seatMapId, organizerId },
            include: {
                zones: {
                    orderBy: [{ zIndex: "asc" }, { name: "asc" }],
                    include: {
                        seats: {
                            orderBy: [{ order: "asc" }],
                        },
                    },
                },
                events: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });

        if (!seatMap) {
            this.throwError("Không tìm thấy sơ đồ ghế", 404);
        }

        return {
            ...seatMap,
            event: seatMap.events[0] || null,
            zones: seatMap.zones.map((zone) => ({
                ...zone,
                isLocked: zone.isLocked === true,
            })),
        };
    }

    normalizeZones(zones) {
        if (!Array.isArray(zones) || zones.length === 0) {
            this.throwError("Sơ đồ ghế cần ít nhất một khu vực");
        }

        return zones.map((zone, index) => {
            const name = typeof zone?.name === "string" ? zone.name.trim() : "";

            if (!name) {
                this.throwError(`Khu vực thứ ${index + 1} cần có tên`);
            }

            const type = ZONE_TYPE_VALUES.includes(zone?.type) ? zone.type : "SEATED";

            // Chỉ SEATED mới sử dụng cấu hình hàng và ghế.
            const rowCount = type === "SEATED" ? Math.floor(this.normalizeNumber(zone?.rowCount)) : 0;
            const seatPerRow = type === "SEATED" ? Math.floor(this.normalizeNumber(zone?.seatPerRow)) : 0;

            if (rowCount < 0 || seatPerRow < 0) {
                this.throwError(`Khu vực "${name}" có số lượng không hợp lệ`);
            }

            if (type === "SEATED" && (rowCount < 1 || seatPerRow < 1)) {
                this.throwError(`Khu vực "${name}" cần ít nhất một hàng và một ghế`);
            }

            const shape = ZONE_SHAPE_VALUES.includes(zone?.shape) ? zone.shape : "RECTANGLE";

            const removedSeats = type === "SEATED" ? this.normalizeSeatKeys(zone?.removedSeats) : [];
            const blockedSeats = type === "SEATED" ? this.normalizeSeatKeys(zone?.blockedSeats) : [];

            // Hình đa giác.
            let points = null;

            if (Array.isArray(zone?.points)) {
                const parsed = zone.points
                    .map((point) => ({
                        x: Number(point?.x),
                        y: Number(point?.y),
                    }))
                    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

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
                            .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
                    )
                    .filter((ring) => ring.length >= 3);

                if (parsedHoles.length > 0) holes = parsedHoles;
            }

            const originParts = Array.isArray(zone?.originParts)
                ? zone.originParts.filter((part) => part && typeof part === "object")
                : null;

            // Chỉ khu vực SEATED mới có danh sách ghế.
            const seats = type === "SEATED" && Array.isArray(zone?.seats) ? zone.seats : [];

            // Không cho phép trùng một ghế trong danh sách thủ công.
            const seatKeys = new Set();

            for (const seat of seats) {
                const rowLabel = typeof seat?.rowLabel === "string" ? seat.rowLabel.trim() : "";
                const seatNumber = typeof seat?.seatNumber === "string" || typeof seat?.seatNumber === "number"
                    ? String(seat.seatNumber).trim()
                    : "";

                if (!rowLabel || !seatNumber) {
                    this.throwError(`Ghế trong khu vực "${name}" thiếu thông tin hàng hoặc số ghế`);
                }

                const key = `${rowLabel}|${seatNumber}`;

                if (seatKeys.has(key)) {
                    this.throwError(`Ghế ${key} bị trùng trong khu vực "${name}"`);
                }

                seatKeys.add(key);
            }

            // Tính sức chứa của Zone.
            let capacity = 0;

            if (type === "STANDING") {
                capacity = Math.max(0, Math.floor(this.normalizeNumber(zone?.capacity)));

                if (capacity < 1) {
                    this.throwError(`Khu vực đứng "${name}" cần có sức chứa lớn hơn 0`);
                }
            }

            if (type === "SEATED") {
                const totalSeats = seats.length > 0 ? seats.length : rowCount * seatPerRow;

                const removedCount = seats.length > 0 ? 0 : removedSeats.length;

                const blockedCount = seats.length > 0
                    ? seats.filter(
                          (seat) =>
                              seat?.status === "BLOCKED" ||
                              blockedSeats.includes(`${String(seat.rowLabel).trim()}|${String(seat.seatNumber).trim()}`)
                      ).length
                    : blockedSeats.filter((key) => !removedSeats.includes(key)).length;

                capacity = Math.max(0, totalSeats - removedCount - blockedCount);
            }

            return {
                name,
                code: typeof zone?.code === "string" && zone.code.trim() ? zone.code.trim() : null,
                color: typeof zone?.color === "string" && zone.color.trim() ? zone.color.trim() : null,
                type,
                shape,
                price: type === "STAGE" ? 0 : Math.max(0, this.normalizeNumber(zone?.price)),
                rowCount,
                seatPerRow,
                capacity,
                posX: this.normalizeNumber(zone?.posX),
                posY: this.normalizeNumber(zone?.posY),
                width: Math.max(1, this.normalizeNumber(zone?.width, 120)),
                height: Math.max(1, this.normalizeNumber(zone?.height, 60)),
                rotation: this.normalizeNumber(zone?.rotation),
                points,
                holes,
                originParts,
                removedSeats,
                blockedSeats,
                seatNumbering: type === "SEATED" && zone?.seatNumbering === "COLUMN" ? "COLUMN" : "ROW",
                combineGroupId: typeof zone?.combineGroupId === "string" && zone.combineGroupId.trim()
                    ? zone.combineGroupId.trim()
                    : null,
                groupId: typeof zone?.groupId === "string" && zone.groupId.trim()
                    ? zone.groupId.trim()
                    : null,
                zIndex: Number.isFinite(Number(zone?.zIndex)) ? Math.round(Number(zone.zIndex)) : index,
                flipX: zone?.flipX === true,
                flipY: zone?.flipY === true,

                // Trạng thái khóa Zone.
                isLocked: zone?.isLocked === true,

                level: Math.max(1, Math.floor(this.normalizeNumber(zone?.level, 1))),
                seats,
            };
        });
    }

    buildSeats(zone, zoneIndex = 0) {
        if (zone.type !== "SEATED") return [];

        const seats = [];
        const removedSeats = new Set(this.normalizeSeatKeys(zone.removedSeats));
        const blockedSeats = new Set(this.normalizeSeatKeys(zone.blockedSeats));
        const direction = zone.seatNumbering === "COLUMN" ? "COLUMN" : "ROW";

        if (zone.seats.length > 0) {
            zone.seats.forEach((seat) => {
                const rowLabel = String(seat.rowLabel).trim();
                const seatNumber = String(seat.seatNumber).trim();
                const key = `${rowLabel}|${seatNumber}`;

                if (removedSeats.has(key)) return;

                seats.push({
                    rowLabel,
                    seatNumber,
                    type: SEAT_TYPE_VALUES.includes(seat.type) ? seat.type : "STANDARD",
                    status: seat.status === "BLOCKED" || blockedSeats.has(key) ? "BLOCKED" : "AVAILABLE",
                    posX: this.normalizeNumber(seat.posX),
                    posY: this.normalizeNumber(seat.posY),
                });
            });
        } else {
            // Tự sinh ghế theo số hàng và ghế mỗi hàng.
            for (let row = 1; row <= zone.rowCount; row += 1) {
                const rowLabel = rowLabelToLetters(row);

                for (let seatNumber = 1; seatNumber <= zone.seatPerRow; seatNumber += 1) {
                    const key = `${rowLabel}|${seatNumber}`;

                    if (removedSeats.has(key)) continue;

                    seats.push({
                        rowLabel,
                        seatNumber: String(seatNumber),
                        type: "STANDARD",
                        status: blockedSeats.has(key) ? "BLOCKED" : "AVAILABLE",
                        posX: 0,
                        posY: 0,
                    });
                }
            }
        }

        const sorted = sortSeatsByNumbering(seats, direction);

        // Tính tọa độ từng ghế theo lưới vuông, canh giữa trong khu vực.
        const cell = (() => {
            const rows = Math.max(0, zone.rowCount || 0);
            const cols = Math.max(0, zone.seatPerRow || 0);

            if (rows === 0 || cols === 0) return 0;

            return Math.max(1, Math.floor(Math.min((zone.width || 0) / cols, (zone.height || 0) / rows)));
        })();

        const originX = (() => {
            const cols = Math.max(0, zone.seatPerRow || 0);
            if (cols === 0 || cell === 0) return 0;
            return Math.round(((zone.width || 0) - cell * cols) / 2);
        })();

        const originY = (() => {
            const rows = Math.max(0, zone.rowCount || 0);
            if (rows === 0 || cell === 0) return 0;
            return Math.round(((zone.height || 0) - cell * rows) / 2);
        })();

        return sorted.map((seat, index) => {
            const rowNumber = getRowOrder(seat.rowLabel);
            const colNumber = Number(seat.seatNumber) || 0;
            const hasPosition = rowNumber > 0 && colNumber > 0 && cell > 0;

            return {
                ...seat,
                posX: hasPosition ? originX + (colNumber - 1) * cell : seat.posX || 0,
                posY: hasPosition ? originY + (rowNumber - 1) * cell : seat.posY || 0,
                order: zoneIndex * 10000 + index,
            };
        });
    }

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
            removedSeats: zone.removedSeats.length > 0 ? zone.removedSeats : undefined,
            blockedSeats: zone.blockedSeats.length > 0 ? zone.blockedSeats : undefined,
            seatNumbering: zone.seatNumbering,
            combineGroupId: zone.combineGroupId,
            groupId: zone.groupId,
            zIndex: zone.zIndex,
            flipX: zone.flipX,
            flipY: zone.flipY,

            // Lưu trạng thái khóa Zone.
            isLocked: zone.isLocked === true,
        };
    }

    buildSeatCreateData(zone, zoneIndex) {
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

    async createSeatMap({ organizerId, name, status, zones, canvasWidth, canvasHeight }) {
        this.validateOrganizer(organizerId);

        if (typeof name !== "string" || !name.trim()) {
            this.throwError("Tên sơ đồ ghế không được để trống");
        }

        const normalizedZones = this.normalizeZones(zones);
        const canvas = this.normalizeCanvas(canvasWidth, canvasHeight);

        try {
            return await prisma.seatMap.create({
                data: {
                    name: name.trim(),
                    status: SEAT_MAP_STATUS_VALUES.includes(status) ? status : "DRAFT",
                    organizerId,
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height,
                    zones: {
                        create: normalizedZones.map((zone, zoneIndex) => ({
                            ...this.buildZoneData(zone),
                            seats: this.buildSeatCreateData(zone, zoneIndex),
                        })),
                    },
                },
                include: {
                    zones: {
                        include: { seats: true },
                    },
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async updateSeatMap({ seatMapId, organizerId, name, status, zones, canvasWidth, canvasHeight }) {
        this.validateOrganizer(organizerId);

        if (!this.isValidId(seatMapId)) {
            this.throwError("ID sơ đồ ghế không hợp lệ");
        }

        const seatMap = await prisma.seatMap.findFirst({
            where: { id: seatMapId, organizerId },
        });

        if (!seatMap) {
            this.throwError("Không tìm thấy sơ đồ ghế", 404);
        }

        if (seatMap.status === "ARCHIVED") {
            this.throwError("Sơ đồ ghế đã lưu trữ, không thể chỉnh sửa");
        }

        const data = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                this.throwError("Tên sơ đồ ghế không được để trống");
            }

            data.name = name.trim();
        }

        if (status !== undefined) {
            if (!SEAT_MAP_STATUS_VALUES.includes(status)) {
                this.throwError("Trạng thái sơ đồ ghế không hợp lệ");
            }

            data.status = status;
        }

        if (canvasWidth !== undefined || canvasHeight !== undefined) {
            const canvas = this.normalizeCanvas(
                canvasWidth ?? seatMap.canvasWidth,
                canvasHeight ?? seatMap.canvasHeight
            );

            data.canvasWidth = canvas.width;
            data.canvasHeight = canvas.height;
        }

        try {
            if (zones !== undefined) {
                const normalizedZones = this.normalizeZones(zones);

                const linkedTicketTypes = await prisma.ticketType.count({
                    where: {
                        zone: { seatMapId: seatMap.id },
                    },
                });

                if (linkedTicketTypes > 0) {
                    this.throwError(
                        "Sơ đồ ghế đã được dùng để tạo loại vé, không thể chỉnh sửa. Hãy nhân bản sơ đồ để tạo bản mới.",
                        409
                    );
                }

                await prisma.$transaction(async (tx) => {
                    await tx.seat.deleteMany({
                        where: {
                            zone: { seatMapId: seatMap.id },
                        },
                    });

                    await tx.zone.deleteMany({
                        where: { seatMapId: seatMap.id },
                    });

                    for (let index = 0; index < normalizedZones.length; index += 1) {
                        const zone = normalizedZones[index];

                        const createdZone = await tx.zone.create({
                            data: {
                                seatMapId: seatMap.id,
                                ...this.buildZoneData(zone),
                            },
                        });

                        const seats = this.buildSeats(zone, index);

                        if (seats.length > 0) {
                            await tx.seat.createMany({
                                data: seats.map((seat) => ({
                                    zoneId: createdZone.id,
                                    rowLabel: seat.rowLabel,
                                    seatNumber: seat.seatNumber,
                                    type: seat.type,
                                    status: seat.status,
                                    posX: seat.posX,
                                    posY: seat.posY,
                                    order: seat.order,
                                })),
                            });
                        }
                    }
                });
            }

            return await prisma.seatMap.update({
                where: { id: seatMap.id },
                data,
                include: {
                    zones: {
                        include: { seats: true },
                    },
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async duplicateSeatMap({ seatMapId, organizerId, name }) {
        this.validateOrganizer(organizerId);

        if (!this.isValidId(seatMapId)) {
            this.throwError("ID sơ đồ ghế không hợp lệ");
        }

        const source = await prisma.seatMap.findFirst({
            where: { id: seatMapId, organizerId },
            include: {
                zones: {
                    orderBy: [{ zIndex: "asc" }, { name: "asc" }],
                    include: {
                        seats: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!source) {
            this.throwError("Không tìm thấy sơ đồ ghế", 404);
        }

        const newName = typeof name === "string" && name.trim()
            ? name.trim()
            : `${source.name} (bản sao)`;

        try {
            return await prisma.seatMap.create({
                data: {
                    name: newName,
                    status: "DRAFT",
                    organizerId,
                    canvasWidth: source.canvasWidth,
                    canvasHeight: source.canvasHeight,
                    zones: {
                        create: source.zones.map((zone) => ({
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
                            removedSeats: zone.removedSeats ?? undefined,
                            blockedSeats: zone.blockedSeats ?? undefined,
                            seatNumbering: zone.seatNumbering ?? "ROW",
                            combineGroupId: zone.combineGroupId,
                            groupId: zone.groupId,
                            zIndex: zone.zIndex,
                            flipX: zone.flipX,
                            flipY: zone.flipY,

                            // Giữ trạng thái khóa khi nhân bản.
                            isLocked: zone.isLocked === true,

                            seats: {
                                create: zone.seats.map((seat) => ({
                                    rowLabel: seat.rowLabel,
                                    seatNumber: seat.seatNumber,
                                    type: seat.type,
                                    status: seat.status,
                                    posX: seat.posX,
                                    posY: seat.posY,
                                    order: seat.order ?? 0,
                                })),
                            },
                        })),
                    },
                },
                include: {
                    zones: {
                        include: { seats: true },
                    },
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async deleteSeatMap({ seatMapId, organizerId }) {
        this.validateOrganizer(organizerId);

        if (!this.isValidId(seatMapId)) {
            this.throwError("ID sơ đồ ghế không hợp lệ");
        }

        const seatMap = await prisma.seatMap.findFirst({
            where: { id: seatMapId, organizerId },
            include: {
                events: {
                    select: { id: true },
                },
            },
        });

        if (!seatMap) {
            this.throwError("Không tìm thấy sơ đồ ghế", 404);
        }

        if (seatMap.events.length > 0) {
            this.throwError("Không thể xóa sơ đồ ghế đang được gắn cho một sự kiện", 409);
        }

        await prisma.seatMap.delete({
            where: { id: seatMap.id },
        });

        return {
            message: "Xóa sơ đồ ghế thành công",
        };
    }

    handlePrismaError(error) {
        if (error.code === "P2002") {
            this.throwError("Dữ liệu sơ đồ ghế bị trùng. Vui lòng kiểm tra lại.", 409);
        }

        throw error;
    }
}

module.exports = new OrganizerSeatMapService();
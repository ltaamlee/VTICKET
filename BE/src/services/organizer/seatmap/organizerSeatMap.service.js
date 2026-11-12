const prisma = require("../../../config/prisma");

const BaseService = require("../../public/base.service");
const seatMapValidationService = require("./seatMapValidation.service");
const organizerZoneService = require("../zone/organizerZone.service");

const SEAT_MAP_STATUS_VALUES = ["DRAFT", "READY", "ARCHIVED"];

class OrganizerSeatMapService extends BaseService {
    validateOrganizer(organizerId) {
        if (!organizerId) {
            this.throwError("Không xác định được tài khoản Ban tổ chức", 401);
        }
    }

    // Lấy danh sách SeatMap của Ban tổ chức
    async getSeatMaps({ organizerId, keyword = "" }) {
        this.validateOrganizer(organizerId);

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

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
            seatCount: seatMap.zones.reduce(
                (total, zone) => total + zone._count.seats,
                0
            ),
            capacity: seatMap.zones.reduce(
                (total, zone) =>
                    total + (zone.type === "STAGE" ? 0 : zone.capacity || 0),
                0
            ),
            zones: seatMap.zones.map((zone) => ({
                ...zone,
                isLocked: zone.isLocked === true,
                seatCount: zone._count.seats,
            })),
        }));
    }

    // Lấy chi tiết SeatMap
    async getSeatMapDetail({ seatMapId, organizerId }) {
        this.validateOrganizer(organizerId);

        if (!seatMapValidationService.isValidId(seatMapId)) {
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

    // Tạo SeatMap
    async createSeatMap({
        organizerId,
        name,
        status,
        zones,
        canvasWidth,
        canvasHeight,
    }) {
        this.validateOrganizer(organizerId);

        if (typeof name !== "string" || !name.trim()) {
            this.throwError("Tên sơ đồ ghế không được để trống");
        }
        
        const canvas = seatMapValidationService.normalizeCanvas(
            canvasWidth,
            canvasHeight
        );

        try {
            return await prisma.$transaction(async (tx) => {
                const seatMap = await tx.seatMap.create({
                    data: {
                        name: name.trim(),
                        status: SEAT_MAP_STATUS_VALUES.includes(status)
                            ? status
                            : "DRAFT",
                        organizerId,
                        canvasWidth: canvas.width,
                        canvasHeight: canvas.height,
                    },
                });

                await organizerZoneService.createZonesForSeatMap({
                    tx,
                    seatMapId: seatMap.id,
                    zones,
                });

                return tx.seatMap.findUnique({
                    where: { id: seatMap.id },
                    include: {
                        zones: { include: { seats: true } },
                    },
                });
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    // Cập nhật SeatMap
    async updateSeatMap({
        seatMapId,
        organizerId,
        name,
        status,
        zones,
        canvasWidth,
        canvasHeight,
    }) {
        this.validateOrganizer(organizerId);

        if (!seatMapValidationService.isValidId(seatMapId)) {
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
            const canvas = seatMapValidationService.normalizeCanvas(
                canvasWidth ?? seatMap.canvasWidth,
                canvasHeight ?? seatMap.canvasHeight
            );

            data.canvasWidth = canvas.width;
            data.canvasHeight = canvas.height;
        }

        try {
            return await prisma.$transaction(async (tx) => {
                if (zones !== undefined) {
                    await organizerZoneService.replaceZonesForSeatMap({
                        tx,
                        seatMapId: seatMap.id,
                        zones,
                    });
                }

                return tx.seatMap.update({
                    where: { id: seatMap.id },
                    data,
                    include: {
                        zones: { include: { seats: true } },
                    },
                });
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    // Nhân bản SeatMap
    async duplicateSeatMap({ seatMapId, organizerId, name }) {
        this.validateOrganizer(organizerId);

        if (!seatMapValidationService.isValidId(seatMapId)) {
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

        const newName =
            typeof name === "string" && name.trim()
                ? name.trim()
                : `${source.name} (bản sao)`;

        try {
            return await prisma.$transaction(async (tx) => {
                const duplicate = await tx.seatMap.create({
                    data: {
                        name: newName,
                        status: "DRAFT",
                        organizerId,
                        canvasWidth: source.canvasWidth,
                        canvasHeight: source.canvasHeight,
                    },
                });

                await organizerZoneService.createZonesForSeatMap({
                    tx,
                    seatMapId: duplicate.id,
                    zones: source.zones,
                });

                return tx.seatMap.findUnique({
                    where: { id: duplicate.id },
                    include: {
                        zones: { include: { seats: true } },
                    },
                });
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    // Xóa SeatMap.
    async deleteSeatMap({ seatMapId, organizerId }) {
        this.validateOrganizer(organizerId);

        if (!seatMapValidationService.isValidId(seatMapId)) {
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
            this.throwError(
                "Không thể xóa sơ đồ ghế đang được gắn cho một sự kiện",
                409
            );
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
            this.throwError(
                "Dữ liệu sơ đồ ghế bị trùng. Vui lòng kiểm tra lại.",
                409
            );
        }

        throw error;
    }
}

module.exports = new OrganizerSeatMapService();
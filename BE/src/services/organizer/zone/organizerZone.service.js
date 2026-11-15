const prisma = require("../../../config/prisma");

const BaseService = require("../../public/base.service");
const zoneValidationService = require("./zoneValidation.service");
const zoneBuilderService = require("./zoneBuilder.service");

class OrganizerZoneService extends BaseService {
    validateOrganizer(organizerId) {
        if (!organizerId) {
            this.throwError("Không xác định được tài khoản Ban tổ chức", 401);
        }
    }

    validateId(id, message) {
        if (!zoneValidationService.isValidId(id)) {
            this.throwError(message);
        }
    }

    async findOwnedSeatMap({
        seatMapId,
        organizerId,
        db = prisma,
        allowArchived = false,
    }) {
        this.validateOrganizer(organizerId);
        this.validateId(seatMapId, "ID sơ đồ ghế không hợp lệ");

        const seatMap = await db.seatMap.findFirst({
            where: { id: seatMapId, organizerId },
            select: { id: true, status: true },
        });

        if (!seatMap) {
            this.throwError("Không tìm thấy sơ đồ ghế", 404);
        }

        if (!allowArchived && seatMap.status === "ARCHIVED") {
            this.throwError("Sơ đồ ghế đã lưu trữ, không thể chỉnh sửa");
        }

        return seatMap;
    }

    async getZones({ seatMapId, organizerId }) {
        await this.findOwnedSeatMap({
            seatMapId,
            organizerId,
            allowArchived: true,
        });

        return prisma.zone.findMany({
            where: { seatMapId },
            orderBy: [{ zIndex: "asc" }, { createdAt: "asc" }],
            include: {
                seats: { orderBy: { order: "asc" } },
                _count: { select: { seats: true } },
            },
        });
    }

    async getZoneDetail({ zoneId, organizerId }) {
        this.validateOrganizer(organizerId);
        this.validateId(zoneId, "ID khu vực không hợp lệ");

        const zone = await prisma.zone.findFirst({
            where: {
                id: zoneId,
                seatMap: { organizerId },
            },
            include: {
                seats: { orderBy: { order: "asc" } },
                seatMap: { select: { id: true, name: true } },
            },
        });

        if (!zone) {
            this.throwError("Không tìm thấy khu vực", 404);
        }

        return zone;
    }

    async createZone({ seatMapId, organizerId, zone }) {
        await this.findOwnedSeatMap({ seatMapId, organizerId });
        const normalizedZone = zoneValidationService.normalizeZone(zone);

        try {
            return await prisma.$transaction(async (tx) => {
                const createdZone = await this.createZoneForSeatMap({
                    tx,
                    seatMapId,
                    zone: normalizedZone,
                    zoneIndex: normalizedZone.zIndex,
                });

                await this.syncTicketTypeForZone(tx, seatMapId, createdZone);

                return tx.zone.findUnique({
                    where: { id: createdZone.id },
                    include: { seats: { orderBy: { order: "asc" } } },
                });
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async updateZone({ zoneId, organizerId, zone }) {
        this.validateOrganizer(organizerId);
        this.validateId(zoneId, "ID khu vực không hợp lệ");

        const currentZone = await prisma.zone.findFirst({
            where: {
                id: zoneId,
                seatMap: { organizerId },
            },
            include: {
                seatMap: { select: { status: true } },
                seats: {
                    orderBy: { order: "asc" },
                    include: {
                        _count: { select: { tickets: true } },
                    },
                },
                ticketTypes: {
                    include: {
                        _count: {
                            select: { tickets: true, orderItems: true },
                        },
                    },
                },
            },
        });

        if (!currentZone) {
            this.throwError("Không tìm thấy khu vực", 404);
        }

        if (currentZone.seatMap.status === "ARCHIVED") {
            this.throwError("Sơ đồ ghế đã lưu trữ, không thể chỉnh sửa");
        }

        const normalizedZone = zoneValidationService.normalizeZone({
            ...currentZone,
            ...zone,
            seats: zone?.seats === undefined ? currentZone.seats : zone.seats,
        });
        const desiredSeats = zoneBuilderService.buildSeats(normalizedZone);
        const currentSeats = currentZone.seats.map((seat) => ({
            rowLabel: seat.rowLabel,
            seatNumber: seat.seatNumber,
            type: seat.type,
            status: seat.status,
        }));
        const desiredSeatStructure = desiredSeats.map((seat) => ({
            rowLabel: seat.rowLabel,
            seatNumber: seat.seatNumber,
            type: seat.type,
            status: seat.status,
        }));
        const seatsChanged =
            JSON.stringify(currentSeats) !==
            JSON.stringify(desiredSeatStructure);
        const currentSeatLayout = currentZone.seats.map((seat) => ({
            rowLabel: seat.rowLabel,
            seatNumber: seat.seatNumber,
            posX: seat.posX,
            posY: seat.posY,
            order: seat.order,
        }));
        const desiredSeatLayout = desiredSeats.map((seat) => ({
            rowLabel: seat.rowLabel,
            seatNumber: seat.seatNumber,
            posX: seat.posX,
            posY: seat.posY,
            order: seat.order,
        }));
        const seatLayoutChanged =
            JSON.stringify(currentSeatLayout) !==
            JSON.stringify(desiredSeatLayout);

        if (
            normalizedZone.type === "STAGE" &&
            currentZone.ticketTypes.length > 0
        ) {
            this.throwError(
                "Không thể đổi khu vực đã có loại vé thành khu vực sân khấu",
                409
            );
        }

        for (const ticketType of currentZone.ticketTypes) {
            if (normalizedZone.capacity < ticketType.soldQuantity) {
                this.throwError(
                    `Sức chứa không thể thấp hơn số vé đã bán (${ticketType.soldQuantity})`,
                    409
                );
            }
        }

        if (seatsChanged && currentZone.seats.some((seat) => seat._count.tickets > 0)) {
            this.throwError(
                "Không thể thay đổi danh sách ghế đã phát sinh vé",
                409
            );
        }

        try {
            return await prisma.$transaction(async (tx) => {
                const updatedZone = await tx.zone.update({
                    where: { id: currentZone.id },
                    data: zoneBuilderService.buildZoneData(normalizedZone),
                });

                if (seatsChanged) {
                    await tx.seat.deleteMany({
                        where: { zoneId: currentZone.id },
                    });

                    if (desiredSeats.length > 0) {
                        await tx.seat.createMany({
                            data: desiredSeats.map((seat) => ({
                                zoneId: currentZone.id,
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
                } else if (seatLayoutChanged) {
                    const desiredByKey = new Map(
                        desiredSeats.map((seat) => [
                            `${seat.rowLabel}|${seat.seatNumber}`,
                            seat,
                        ])
                    );

                    for (const seat of currentZone.seats) {
                        const desired = desiredByKey.get(
                            `${seat.rowLabel}|${seat.seatNumber}`
                        );

                        if (
                            seat.posX !== desired.posX ||
                            seat.posY !== desired.posY ||
                            seat.order !== desired.order
                        ) {
                            await tx.seat.update({
                                where: { id: seat.id },
                                data: {
                                    posX: desired.posX,
                                    posY: desired.posY,
                                    order: desired.order,
                                },
                            });
                        }
                    }
                }

                await this.syncTicketTypeForZone(
                    tx,
                    currentZone.seatMapId,
                    updatedZone
                );

                return tx.zone.findUnique({
                    where: { id: currentZone.id },
                    include: { seats: { orderBy: { order: "asc" } } },
                });
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async deleteZone({ zoneId, organizerId }) {
        this.validateOrganizer(organizerId);
        this.validateId(zoneId, "ID khu vực không hợp lệ");

        const zone = await prisma.zone.findFirst({
            where: {
                id: zoneId,
                seatMap: { organizerId },
            },
            include: {
                seatMap: { select: { status: true } },
                seats: {
                    include: {
                        _count: { select: { tickets: true } },
                    },
                },
                ticketTypes: {
                    include: {
                        _count: {
                            select: { tickets: true, orderItems: true },
                        },
                    },
                },
            },
        });

        if (!zone) {
            this.throwError("Không tìm thấy khu vực", 404);
        }

        if (zone.seatMap.status === "ARCHIVED") {
            this.throwError("Sơ đồ ghế đã lưu trữ, không thể chỉnh sửa");
        }

        if (zone.seats.some((seat) => seat._count.tickets > 0)) {
            this.throwError(
                "Không thể xóa khu vực đã có vé gắn với ghế",
                409
            );
        }

        if (
            zone.ticketTypes.some(
                (ticketType) =>
                    ticketType.soldQuantity > 0 ||
                    ticketType._count.tickets > 0 ||
                    ticketType._count.orderItems > 0
            )
        ) {
            this.throwError(
                "Không thể xóa khu vực đã có vé hoặc đơn hàng",
                409
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.ticketType.deleteMany({
                where: { zoneId: zone.id },
            });
            await tx.zone.delete({ where: { id: zone.id } });
        });

        return { message: "Xóa khu vực thành công" };
    }

    async createZoneForSeatMap({ tx, seatMapId, zone, zoneIndex = 0 }) {
        const normalizedZone = zoneValidationService.normalizeZone(zone);

        return tx.zone.create({
            data: {
                seatMapId,
                ...zoneBuilderService.buildZoneData(normalizedZone),
                seats: zoneBuilderService.buildSeatCreateData(
                    normalizedZone,
                    zoneIndex
                ),
            },
        });
    }

    async createZonesForSeatMap({ tx, seatMapId, zones }) {
        const normalizedZones = zoneValidationService.normalizeZones(zones);
        const createdZones = [];

        for (let index = 0; index < normalizedZones.length; index += 1) {
            createdZones.push(
                await this.createZoneForSeatMap({
                    tx,
                    seatMapId,
                    zone: normalizedZones[index],
                    zoneIndex: index,
                })
            );
        }

        return createdZones;
    }

    async replaceZonesForSeatMap({ tx, seatMapId, zones }) {
        const normalizedZones = zoneValidationService.normalizeZones(zones);
        const linkedTicketTypes = await tx.ticketType.findMany({
            where: { zone: { seatMapId } },
            include: {
                _count: {
                    select: { tickets: true, orderItems: true },
                },
            },
        });

        if (
            linkedTicketTypes.some(
                (ticketType) =>
                    ticketType.soldQuantity > 0 ||
                    ticketType._count.tickets > 0 ||
                    ticketType._count.orderItems > 0
            )
        ) {
            this.throwError(
                "Không thể thay đổi toàn bộ sơ đồ đã có vé hoặc đơn hàng; hãy cập nhật từng khu vực.",
                409
            );
        }

        await tx.ticketType.deleteMany({
            where: { zone: { seatMapId } },
        });
        await tx.seat.deleteMany({ where: { zone: { seatMapId } } });
        await tx.zone.deleteMany({ where: { seatMapId } });

        const createdZones = await this.createZonesForSeatMap({
            tx,
            seatMapId,
            zones: normalizedZones,
        });
        const event = await tx.event.findFirst({
            where: { seatMapId },
            select: {
                id: true,
                saleStartAt: true,
                saleEndAt: true,
            },
        });

        if (event) {
            await this.syncTicketTypesForEvent(tx, {
                eventId: event.id,
                seatMapId,
                saleStartAt: event.saleStartAt,
                saleEndAt: event.saleEndAt,
            });
        }

        return createdZones;
    }

    async syncTicketTypesForEvent(
        tx,
        { eventId, seatMapId, saleStartAt, saleEndAt }
    ) {
        const zones = seatMapId
            ? await tx.zone.findMany({
                  where: {
                      seatMapId,
                      type: { not: "STAGE" },
                  },
              })
            : [];
        const existingTicketTypes = await tx.ticketType.findMany({
            where: { eventId },
            include: {
                _count: {
                    select: { tickets: true, orderItems: true },
                },
            },
        });
        const zoneIds = new Set(zones.map((zone) => zone.id));
        const staleTypes = existingTicketTypes.filter(
            (ticketType) => !zoneIds.has(ticketType.zoneId)
        );

        if (
            staleTypes.some(
                (ticketType) =>
                    ticketType.soldQuantity > 0 ||
                    ticketType._count.tickets > 0 ||
                    ticketType._count.orderItems > 0
            )
        ) {
            this.throwError(
                "Không thể đổi sơ đồ vì loại vé đã có đơn hàng hoặc vé",
                409
            );
        }

        if (staleTypes.length > 0) {
            await tx.ticketType.deleteMany({
                where: {
                    id: { in: staleTypes.map((ticketType) => ticketType.id) },
                },
            });
        }

        const ticketTypes = [];

        for (const zone of zones) {
            const existing = existingTicketTypes.find(
                (ticketType) => ticketType.zoneId === zone.id
            );
            const data = {
                name: zone.name,
                price: zone.price,
                capacity: zone.capacity,
                saleStartAt: saleStartAt ?? null,
                saleEndAt: saleEndAt ?? null,
            };

            if (existing) {
                if (zone.capacity < existing.soldQuantity) {
                    this.throwError(
                        `Sức chứa khu vực "${zone.name}" thấp hơn số vé đã bán`,
                        409
                    );
                }

                ticketTypes.push(
                    await tx.ticketType.update({
                        where: { id: existing.id },
                        data,
                    })
                );
            } else {
                ticketTypes.push(
                    await tx.ticketType.create({
                        data: {
                            eventId,
                            zoneId: zone.id,
                            ...data,
                        },
                    })
                );
            }
        }

        return ticketTypes;
    }

    async syncTicketTypeForZone(tx, seatMapId, zone) {
        const event = await tx.event.findFirst({
            where: {
                seatMapId,
            },
            select: {
                id: true,
                saleStartAt: true,
                saleEndAt: true,
            },
        });

        if (!event) return null;

        if (zone.type === "STAGE") {
            return null;
        }

        const existing = await tx.ticketType.findFirst({
            where: { eventId: event.id, zoneId: zone.id },
        });

        const data = {
            name: zone.name,
            price: zone.price,
            capacity: zone.capacity,
            saleStartAt: event.saleStartAt,
            saleEndAt: event.saleEndAt,
        };

        if (existing) {
            if (zone.capacity < existing.soldQuantity) {
                this.throwError(
                    `Sức chứa khu vực "${zone.name}" thấp hơn số vé đã bán`,
                    409
                );
            }

            return tx.ticketType.update({
                where: { id: existing.id },
                data,
            });
        }

        return tx.ticketType.create({
            data: {
                eventId: event.id,
                zoneId: zone.id,
                ...data,
            },
        });
    }

    handlePrismaError(error) {
        if (error.code === "P2002") {
            this.throwError("Thông tin khu vực hoặc ghế bị trùng.", 409);
        }

        throw error;
    }
}

module.exports = new OrganizerZoneService();
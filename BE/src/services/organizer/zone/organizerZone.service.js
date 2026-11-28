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

        const sessions = await tx.eventSession.findMany({
            where: { eventId },
        });
        const updates = [];
        const creates = [];
        const eventTypeIds = new Map();
        const existingByZone = new Map();
        for (const ticketType of existingTicketTypes) {
            if (!existingByZone.has(ticketType.zoneId)) {
                existingByZone.set(ticketType.zoneId, new Map());
            }
            const bySession = existingByZone.get(ticketType.zoneId);
            const sessionId = ticketType.sessionId || null;
            if (!bySession.has(sessionId)) bySession.set(sessionId, ticketType);
        }
        const sessionIds = [null, ...sessions.map((session) => session.id)];

        for (const zone of zones) {
            const data = {
                name: zone.name,
                price: zone.price,
                capacity: zone.capacity,
                saleStartAt: saleStartAt ?? null,
                saleEndAt: saleEndAt ?? null,
            };
            const ids = [];
            const bySession = existingByZone.get(zone.id);
            for (const sessionId of sessionIds) {
                const existing = bySession?.get(sessionId);

                if (existing) {
                    if (zone.capacity < existing.soldQuantity) {
                        this.throwError(
                            `Sức chứa khu vực "${zone.name}" thấp hơn số vé đã bán`,
                            409
                        );
                    }
                    ids.push(existing.id);
                    if (!sessionId) eventTypeIds.set(zone.id, existing.id);
                } else {
                    creates.push({
                        eventId,
                        zoneId: zone.id,
                        ...(sessionId ? { sessionId } : {}),
                        ...data,
                    });
                }
            }
            if (ids.length > 0) updates.push({ ids, data });
        }

        for (const { ids, data } of updates) {
            await tx.ticketType.updateMany({
                where: { id: { in: ids } },
                data,
            });
        }
        if (creates.length > 0) {
            await tx.ticketType.createMany({ data: creates });
        }

        if (zones.length === 0) return [];
        const syncedTypes = await tx.ticketType.findMany({ where: { eventId } });
        return zones.map((zone) => {
            const ticketType = syncedTypes.find((ticketType) =>
                eventTypeIds.has(zone.id)
                    ? ticketType.id === eventTypeIds.get(zone.id)
                    : ticketType.zoneId === zone.id && !ticketType.sessionId
            );
            if (!ticketType) {
                this.throwError("Không thể đồng bộ loại vé cho khu vực", 500);
            }
            return ticketType;
        });
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

        const ticketTypes = await tx.ticketType.findMany({
            where: { eventId: event.id, zoneId: zone.id },
        });
        const existing = ticketTypes.find(
            (ticketType) => !ticketType.sessionId
        );

        const data = {
            name: zone.name,
            price: zone.price,
            capacity: zone.capacity,
            saleStartAt: event.saleStartAt,
            saleEndAt: event.saleEndAt,
        };

        let eventTicketType;
        if (existing) {
            if (zone.capacity < existing.soldQuantity) {
                this.throwError(
                    `Sức chứa khu vực "${zone.name}" thấp hơn số vé đã bán`,
                    409
                );
            }

            eventTicketType = await tx.ticketType.update({
                where: { id: existing.id },
                data,
            });
        } else {
            eventTicketType = await tx.ticketType.create({
                data: {
                    eventId: event.id,
                    zoneId: zone.id,
                    ...data,
                },
            });
        }

        const sessions = await tx.eventSession.findMany({
            where: { eventId: event.id },
        });
        for (const session of sessions) {
            const existingSessionType = ticketTypes.find(
                (ticketType) => ticketType.sessionId === session.id
            );
            if (existingSessionType) {
                if (zone.capacity < existingSessionType.soldQuantity) {
                    this.throwError(
                        `Sức chứa khu vực "${zone.name}" thấp hơn số vé đã bán`,
                        409
                    );
                }
                await tx.ticketType.update({
                    where: { id: existingSessionType.id },
                    data,
                });
            } else {
                await tx.ticketType.create({
                    data: {
                        eventId: event.id,
                        sessionId: session.id,
                        zoneId: zone.id,
                        ...data,
                    },
                });
            }
        }

        return eventTicketType;
    }

    handlePrismaError(error) {
        if (error.code === "P2002") {
            this.throwError("Thông tin khu vực hoặc ghế bị trùng.", 409);
        }

        throw error;
    }
}

module.exports = new OrganizerZoneService();
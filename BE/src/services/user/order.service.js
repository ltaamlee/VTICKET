const crypto = require("node:crypto");
const prisma = require("../../config/prisma");
const { getRedisClient } = require("../../config/redis");
const { BadRequestException, ConflictException, NotFoundException } = require("../../exceptions");
const { pickSeats } = require("../../utils/seatPicker");
const paymentService = require("../payment/payment.service");
const ensurePaymentIndexes = require("../payment/paymentIndexes");
const JwtUtils = require("../../utils/jwtUtils");
const generateOrderCode = require("../../utils/orderCode");
const { enterWaitingRoom } = require("./waitingRoom.service");

const HOLD_MS = 15 * 60 * 1000;
const objectId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

function assertId(id) {
    if (!objectId(id)) throw new BadRequestException("Mã đơn hàng hoặc sự kiện không hợp lệ");
}

async function releaseInTransaction(tx, orderId, status, expiresAt) {
    const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT", ...(expiresAt ? { expiresAt: { lte: expiresAt } } : {}) },
        data: { status },
    });
    if (!updated.count) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
        await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { soldQuantity: { decrement: item.quantity } },
        });
        await tx.ticket.updateMany({
            where: { orderItemId: item.id, status: "RESERVED" },
            data: { status },
        });
    }
    await tx.seatAllocation.deleteMany({ where: { orderId } });
    return true;
}

async function expireInTransaction(tx, orderId, now) {
    return releaseInTransaction(tx, orderId, "EXPIRED", now);
}

async function releaseReservationInTransaction(tx, reservationId, status, now) {
    const reservation = await tx.bookingReservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.status !== "PENDING_PAYMENT" ||
        (now && reservation.expiresAt > now)) return false;
    const updated = await tx.bookingReservation.updateMany({
        where: { id: reservationId, status: "PENDING_PAYMENT", ...(now ? { expiresAt: { lte: now } } : {}) },
        data: { status, items: [] },
    });
    if (!updated.count) return false;
    for (const item of reservation.items) {
        await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { soldQuantity: { decrement: item.quantity } },
        });
    }
    await tx.seatAllocation.deleteMany({ where: { orderId: reservationId } });
    return true;
}

async function cancelOrder({ userId, orderId }) {
    assertId(orderId);
    const order = await prisma.$transaction(async (tx) => {
        const owned = await tx.order.findFirst({ where: { id: orderId, userId }, select: { id: true, status: true } });
        if (!owned) {
            const reservation = await tx.bookingReservation.findFirst({ where: { id: orderId, userId } });
            if (!reservation) throw new NotFoundException("Không tìm thấy lượt giữ vé");
            if (reservation.status === "PENDING_PAYMENT") {
                if (!await releaseReservationInTransaction(tx, orderId, "CANCELLED")) {
                    throw new ConflictException("Trạng thái lượt giữ vé đã thay đổi, vui lòng thử lại");
                }
                return { status: "CANCELLED" };
            }
            return { status: reservation.status === "PAID" ? "PAID" : reservation.status };
        }
        if (owned.status === "PENDING_PAYMENT") {
            const released = await releaseInTransaction(tx, orderId, "CANCELLED");
            if (!released) throw new ConflictException("Trạng thái đơn hàng đã thay đổi, vui lòng thử lại");
            return { status: "CANCELLED" };
        }
        return { status: owned.status };
    }).catch((error) => {
        if (error.code === "P2034") throw new ConflictException("Trạng thái đơn hàng đang thay đổi, vui lòng thử lại");
        throw error;
    });
    return order;
}

async function expireOrder(orderId) {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                const now = new Date();
                return await expireInTransaction(tx, orderId, now) ||
                    await releaseReservationInTransaction(tx, orderId, "EXPIRED", now);
            });
        } catch (error) {
            if (error.code !== "P2034" || attempt >= 4) throw error;
        }
    }
}

async function expireDueOrders(eventId) {
    let expired = 0;
    for (;;) {
        const orders = await prisma.order.findMany({
            where: {
                status: "PENDING_PAYMENT",
                expiresAt: { lte: new Date() },
                ...(eventId ? { orderItems: { some: { ticketType: { eventId } } } } : {}),
            },
            select: { id: true },
            take: 100,
        });
        if (!orders.length) break;
        for (const order of orders) {
            if (await expireOrder(order.id)) expired += 1;
        }
    }
    for (;;) {
        const reservations = await prisma.bookingReservation.findMany({
            where: { status: "PENDING_PAYMENT", expiresAt: { lte: new Date() }, ...(eventId ? { eventId } : {}) },
            select: { id: true },
            take: 100,
        });
        if (!reservations.length) break;
        for (const reservation of reservations) {
            if (await expireOrder(reservation.id)) expired += 1;
        }
    }
    return expired;
}

function validateItems(items) {
    if (!Array.isArray(items) || !items.length || items.length > 10) {
        throw new BadRequestException("Vui lòng chọn từ 1 đến 10 hạng vé");
    }
    const ids = new Set();
    const seats = new Set();
    for (const item of items) {
        if (!objectId(item?.ticketTypeId) || !Number.isSafeInteger(item.quantity) ||
            item.quantity < 1 || item.quantity > 10 || ids.has(item.ticketTypeId)) {
            throw new BadRequestException("Số lượng mỗi hạng vé phải từ 1 đến 10 và không được trùng hạng vé");
        }
        if (item.seatIds !== undefined) {
            if (!Array.isArray(item.seatIds) || item.seatIds.length > 10) {
                throw new BadRequestException("Danh sách ghế không hợp lệ");
            }
            for (const seatId of item.seatIds) {
                if (!objectId(seatId) || seats.has(seatId)) throw new BadRequestException("Ghế không hợp lệ hoặc bị chọn trùng");
                seats.add(seatId);
            }
        }
        ids.add(item.ticketTypeId);
    }
}

function isOpen(start, end, now) {
    return (!start || start <= now) && (!end || end > now);
}

function sessionFilter(sessionId) {
    return sessionId
        ? { sessionId }
        : { OR: [{ sessionId: null }, { sessionId: { isSet: false } }] };
}

const EVENT_CACHE_TTL_SECONDS = 45;

async function getApprovedEventForBooking(eventId) {
    const redis = getRedisClient();
    const cacheKey = `booking:event:${eventId}`;
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    ...parsed,
                    saleStartAt: parsed.saleStartAt ? new Date(parsed.saleStartAt) : null,
                    saleEndAt: parsed.saleEndAt ? new Date(parsed.saleEndAt) : null,
                    endAt: parsed.endAt ? new Date(parsed.endAt) : null,
                };
            }
        } catch {
            // Fall back to MongoDB if Redis read fails
        }
    }

    const event = await prisma.event.findFirst({
        where: { id: eventId, status: "APPROVED" },
        select: { id: true, status: true, saleStartAt: true, saleEndAt: true, endAt: true },
    });

    if (event && redis) {
        try {
            await redis.set(cacheKey, JSON.stringify(event), "EX", EVENT_CACHE_TTL_SECONDS);
        } catch {
            // Ignore Redis write failure
        }
    }
    return event;
}

async function startBooking({ userId, eventId }) {
    assertId(userId);
    assertId(eventId);
    const event = await getApprovedEventForBooking(eventId);
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    const now = new Date();
    if (!event.saleStartAt || event.endAt <= now || !isOpen(event.saleStartAt, event.saleEndAt, now)) {
        throw new ConflictException("Sự kiện hiện không mở bán vé");
    }
    const admission = await enterWaitingRoom(eventId, userId);
    if (admission.status === "QUEUED") {
        return {
            status: "QUEUED",
            position: admission.position,
            totalInQueue: admission.total,
            serverTime: now,
        };
    }
    const expiresAt = new Date(Math.floor((now.getTime() + HOLD_MS) / 1000) * 1000);
    return { status: "ADMITTED", token: JwtUtils.generateBookingToken({ userId, eventId }, expiresAt), expiresAt, serverTime: now };
}

function bookingDeadline(token, userId, eventId) {
    if (typeof token !== "string" || !token) throw new BadRequestException("Vui lòng bắt đầu lại lượt mua vé");
    let payload;
    try {
        payload = JwtUtils.verifyBookingToken(token);
    } catch (error) {
        if (error.name === "TokenExpiredError") throw new ConflictException("Lượt mua vé đã hết thời gian");
        if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
            throw new BadRequestException("Lượt mua vé không hợp lệ");
        }
        throw error;
    }
    if (payload.userId !== userId || payload.eventId !== eventId || !Number.isSafeInteger(payload.exp)) {
        throw new BadRequestException("Lượt mua vé không hợp lệ");
    }
    return new Date(payload.exp * 1000);
}

async function hasValidReservation(tx, order) {
    if (!order.orderItems?.length) return false;
    const allocations = await tx.seatAllocation.findMany({ where: { orderId: order.id } });
    const allocationKeys = new Set(allocations.map((allocation) => allocation.key));
    const used = new Set();
    let total = 0;
    for (const item of order.orderItems) {
        const type = item.ticketType;
        if (!type?.zone || !Number.isInteger(item.quantity) || item.quantity < 1 ||
            !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0 ||
            item.subtotal !== item.unitPrice * item.quantity ||
            item.tickets.length !== item.quantity) return false;
        total += item.subtotal;
        for (const ticket of item.tickets) {
            if (ticket.status !== "RESERVED" || ticket.userId !== order.userId ||
                ticket.eventId !== type.eventId || ticket.ticketTypeId !== type.id) return false;
            if (type.zone.type === "SEATED") {
                if (!ticket.seatId || ticket.seat?.zoneId !== type.zoneId) return false;
                const key = `${type.eventId}:${type.sessionId || "event"}:${ticket.seatId}`;
                if (!allocationKeys.has(key) || used.has(key)) return false;
                used.add(key);
            } else if (type.zone.type !== "STANDING" || ticket.seatId) return false;
        }
    }
    return Number.isSafeInteger(total) && total === order.totalAmount && used.size === allocations.length;
}

async function validateBookingReservation(tx, reservation) {
    if (!Array.isArray(reservation.items) || !reservation.items.length) {
        throw new ConflictException("Thông tin giữ vé không hợp lệ");
    }
    const types = await tx.ticketType.findMany({
        where: { id: { in: reservation.items.map((item) => item.ticketTypeId) }, eventId: reservation.eventId, ...sessionFilter(reservation.sessionId) },
        include: { zone: true },
    });
    const allocations = await tx.seatAllocation.findMany({ where: { orderId: reservation.id } });
    const keys = new Set(allocations.map((entry) => entry.key));
    const used = new Set();
    let total = 0;
    for (const item of reservation.items) {
        const type = types.find((entry) => entry.id === item.ticketTypeId);
        if (!type?.zone || !Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
            !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0 ||
            item.subtotal !== item.unitPrice * item.quantity || !Array.isArray(item.seatIds)) {
            throw new ConflictException("Thông tin giữ vé không hợp lệ");
        }
        total += item.subtotal;
        if (type.zone.type === "SEATED") {
            if (item.seatIds.length !== item.quantity) throw new ConflictException("Thông tin giữ ghế không hợp lệ");
            const seats = await tx.seat.findMany({ where: { id: { in: item.seatIds }, zoneId: type.zoneId, status: "AVAILABLE" }, select: { id: true } });
            if (seats.length !== item.quantity) throw new ConflictException("Thông tin giữ ghế không hợp lệ");
            for (const seatId of item.seatIds) {
                const key = `${reservation.eventId}:${reservation.sessionId || "event"}:${seatId}`;
                if (!keys.has(key) || used.has(key)) throw new ConflictException("Thông tin giữ ghế không hợp lệ");
                used.add(key);
            }
        } else if (type.zone.type !== "STANDING" || item.seatIds.length) {
            throw new ConflictException("Thông tin giữ vé không hợp lệ");
        }
    }
    if (types.length !== reservation.items.length || !Number.isSafeInteger(total) ||
        total !== reservation.totalAmount || used.size !== allocations.length) {
        throw new ConflictException("Thông tin giữ vé không hợp lệ");
    }
}

async function finalizeBookingReservation(tx, reservation, now) {
    await validateBookingReservation(tx, reservation);
    const claimed = await tx.bookingReservation.updateMany({
        where: { id: reservation.id, status: "PENDING_PAYMENT", expiresAt: { gt: now } },
        data: { status: "PAID" },
    });
    if (!claimed.count) throw new ConflictException("Lượt giữ vé không còn hiệu lực");
    const order = await tx.order.create({
        data: {
            userId: reservation.userId,
            orderCode: generateOrderCode(reservation.createdAt),
            totalAmount: reservation.totalAmount,
            status: "PAID",
            expiresAt: null,
        },
    });
    for (const item of reservation.items) {
        const orderItem = await tx.orderItem.create({
            data: { orderId: order.id, ticketTypeId: item.ticketTypeId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal },
        });
        await tx.ticket.createMany({
            data: Array.from({ length: item.quantity }, (_, index) => ({
                ticketCode: `T${crypto.randomBytes(16).toString("hex").toUpperCase()}`,
                qrToken: crypto.randomBytes(32).toString("hex"),
                userId: reservation.userId,
                eventId: reservation.eventId,
                ticketTypeId: item.ticketTypeId,
                orderItemId: orderItem.id,
                seatId: item.seatIds[index] || null,
                status: "ISSUED",
                issuedAt: now,
            })),
        });
    }
    await tx.seatAllocation.updateMany({ where: { orderId: reservation.id }, data: { orderId: order.id } });
    await tx.ticketEmailDelivery.create({ data: { orderId: order.id } });
    await tx.bookingReservation.update({ where: { id: reservation.id }, data: { orderId: order.id, items: [] } });
    return order;
}

async function createOrder({ userId, eventId, sessionId, items, bookingToken }) {
    assertId(userId);
    assertId(eventId);
    if (sessionId != null) assertId(sessionId);
    validateItems(items);
    const expiresAt = bookingDeadline(bookingToken, userId, eventId);

    const preCheckNow = new Date();
    if (expiresAt <= preCheckNow) throw new ConflictException("Lượt mua vé đã hết thời gian");
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { sessions: true },
    });
    if (!event || event.status !== "APPROVED") throw new NotFoundException("Không tìm thấy sự kiện đang mở bán");
    if (!event.saleStartAt || event.endAt <= preCheckNow || !isOpen(event.saleStartAt, event.saleEndAt, preCheckNow)) {
        throw new ConflictException("Sự kiện hiện không mở bán vé");
    }
    const session = event.sessions.find((entry) => entry.id === sessionId);
    if ((event.sessions.length && !session) || (!event.sessions.length && sessionId)) {
        throw new BadRequestException("Vui lòng chọn suất diễn hợp lệ");
    }
    if (session && (session.endAt <= preCheckNow || !isOpen(session.saleStartAt, session.saleEndAt, preCheckNow))) {
        throw new ConflictException("Suất diễn hiện không mở bán vé");
    }
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const maxTickets = Math.min(event.maxTicketsPerOrder ?? 10, 10);
    if (quantity > maxTickets) {
        throw new BadRequestException(`Mỗi đơn được mua tối đa ${maxTickets} vé`);
    }

    const types = await prisma.ticketType.findMany({
        where: { id: { in: items.map((item) => item.ticketTypeId) }, eventId, ...sessionFilter(sessionId) },
        include: { zone: true },
    });
    if (types.length !== items.length) throw new BadRequestException("Hạng vé không thuộc suất diễn đã chọn");
    let totalAmount = 0;
    for (const item of items) {
        const type = types.find((entry) => entry.id === item.ticketTypeId);
        if (type.status !== "ACTIVE" || type.zone.type === "STAGE" ||
            !isOpen(type.saleStartAt, type.saleEndAt, preCheckNow)) {
            throw new ConflictException(`Hạng vé ${type.name} hiện không mở bán`);
        }
        const manual = event.seatSelectionMode === "MANUAL" && type.zone.type === "SEATED";
        if (manual ? !Array.isArray(item.seatIds) || item.seatIds.length !== item.quantity : item.seatIds?.length) {
            throw new BadRequestException(manual ? `Vui lòng chọn đủ ghế cho hạng vé ${type.name}` : "Hạng vé này không cho chọn ghế");
        }
        if (!Number.isSafeInteger(type.price) || type.price < 0 ||
            !Number.isSafeInteger(totalAmount + type.price * item.quantity)) {
            throw new BadRequestException("Giá vé không hợp lệ");
        }
        totalAmount += type.price * item.quantity;
    }

    const seatedZoneIds = [...new Set(types.filter((t) => t.zone.type === "SEATED").map((t) => t.zoneId))];
    const seatsByZoneId = new Map();
    if (seatedZoneIds.length > 0) {
        const allZoneSeats = await prisma.seat.findMany({
            where: { zoneId: { in: seatedZoneIds }, status: "AVAILABLE" },
        });
        for (const seat of allZoneSeats) {
            const list = seatsByZoneId.get(seat.zoneId) || [];
            list.push(seat);
            seatsByZoneId.set(seat.zoneId, list);
        }
    }

    const freeOrder = totalAmount === 0;
    let attempts = 0;
    for (;;) {
    try {
    return await prisma.$transaction(async (tx) => {
        const now = new Date();
        if (expiresAt <= now) throw new ConflictException("Lượt mua vé đã hết thời gian");
        const reservation = await tx.bookingReservation.create({
            data: {
                userId,
                eventId,
                sessionId: sessionId || null,
                reference: `VT${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
                totalAmount,
                status: "PENDING_PAYMENT",
                expiresAt,
                items: [],
            },
        });
        const reservationItems = [];
        for (const item of items) {
            const type = types.find((entry) => entry.id === item.ticketTypeId);
            const reserved = await tx.ticketType.updateMany({
                where: { id: type.id, status: "ACTIVE", soldQuantity: { lte: type.capacity - item.quantity } },
                data: { soldQuantity: { increment: item.quantity } },
            });
            if (!reserved.count) {
                throw new ConflictException(`Hạng vé ${type.name} không còn đủ ${item.quantity} vé`);
            }
            let seats = [];
            if (type.zone.type === "SEATED") {
                const prefix = `${eventId}:${sessionId || "event"}:`;
                const allSeats = seatsByZoneId.get(type.zoneId) || [];
                const allocations = await tx.seatAllocation.findMany({
                    where: { key: { startsWith: prefix } },
                    select: { seatId: true },
                });
                const occupied = new Set(allocations.map((entry) => entry.seatId));
                const available = allSeats.filter((seat) => !occupied.has(seat.id));
                if (event.seatSelectionMode === "MANUAL") {
                    seats = item.seatIds.map((id) => available.find((seat) => seat.id === id));
                    if (seats.some((seat) => !seat)) {
                        throw new ConflictException(`Ghế đã chọn của hạng vé ${type.name} không còn khả dụng`);
                    }
                } else {
                    seats = pickSeats(available, item.quantity, type.zone.seatNumbering);
                }
                if (seats.length !== item.quantity) {
                    throw new ConflictException(`Hạng vé ${type.name} không còn đủ ${item.quantity} ghế`);
                }
                await tx.seatAllocation.createMany({
                    data: seats.map((seat) => ({ key: `${prefix}${seat.id}`, orderId: reservation.id, seatId: seat.id })),
                });
            }
            reservationItems.push({
                ticketTypeId: type.id, quantity: item.quantity, unitPrice: type.price,
                subtotal: type.price * item.quantity, seatIds: seats.map((seat) => seat.id),
            });
        }
        reservation.items = reservationItems;
        await tx.bookingReservation.update({ where: { id: reservation.id }, data: { items: reservationItems } });
        if (totalAmount === 0) {
            const order = await finalizeBookingReservation(tx, reservation, now);
            return { id: order.id, orderCode: order.orderCode, totalAmount: order.totalAmount, status: order.status, expiresAt: null };
        }
        return { id: reservation.id, totalAmount, status: reservation.status, expiresAt };
    }, { maxWait: 15000, timeout: 20000 });
    } catch (error) {
        if (error.code === "P2002" && freeOrder && attempts++ < 4) continue;
        if (error.code === "P2002" || error.code === "P2034" || error.code === "P2028") {
            throw new ConflictException("Vé hoặc ghế vừa được người khác giữ, vui lòng chọn lại");
        }
        throw error;
    }
    }
}

async function getAvailableSeats({ eventId, sessionId }) {
    assertId(eventId);
    if (sessionId) assertId(sessionId);
    const event = await prisma.event.findFirst({
        where: { id: eventId, status: "APPROVED" },
        include: { sessions: { select: { id: true } } },
    });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    if (event.seatSelectionMode !== "MANUAL") throw new BadRequestException("Sự kiện không hỗ trợ tự chọn ghế");
    if ((event.sessions.length && !event.sessions.some((session) => session.id === sessionId)) ||
        (!event.sessions.length && sessionId)) {
        throw new BadRequestException("Suất diễn không hợp lệ");
    }
    await expireDueOrders(eventId);
    const prefix = `${eventId}:${sessionId || "event"}:`;
    const [types, allocations] = await Promise.all([
        prisma.ticketType.findMany({
            where: { eventId, ...sessionFilter(sessionId), status: "ACTIVE", zone: { type: "SEATED" } },
            include: { zone: { include: { seats: { orderBy: { order: "asc" } } } } },
        }),
        prisma.seatAllocation.findMany({ where: { key: { startsWith: prefix } }, select: { seatId: true } }),
    ]);
    const occupied = new Set(allocations.map((allocation) => allocation.seatId));
    return types.map((type) => ({
        ticketTypeId: type.id,
        zoneName: type.zone.name,
        seats: type.zone.seats.map((seat) => ({
            id: seat.id, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber,
            available: seat.status === "AVAILABLE" && !occupied.has(seat.id),
        })),
    }));
}

async function getOrder({ userId, orderId, sync = false }) {
    assertId(orderId);
    const owned = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
    if (!owned) {
        let reservation = await prisma.bookingReservation.findFirst({ where: { id: orderId, userId } });
        if (!reservation) throw new NotFoundException("Không tìm thấy lượt giữ vé");
        if (reservation.status === "PENDING_PAYMENT" && reservation.expiresAt <= new Date()) {
            await expireOrder(orderId);
            reservation = await prisma.bookingReservation.findFirst({ where: { id: orderId, userId } });
        }
        if (sync && reservation.status === "PENDING_PAYMENT" && reservation.expiresAt > new Date()) {
            await paymentService.syncOrderWithSePay(reservation.reference);
            reservation = await prisma.bookingReservation.findFirst({ where: { id: orderId, userId } });
        }
        if (reservation.status === "PAID" && reservation.orderId) {
            return getOrder({ userId, orderId: reservation.orderId });
        }
        const types = reservation.items.length ? await prisma.ticketType.findMany({
            where: { id: { in: reservation.items.map((item) => item.ticketTypeId) } },
            include: { event: true, session: true, zone: true },
        }) : [];
        return {
            id: reservation.id, eventId: reservation.eventId, orderCode: null,
            status: reservation.status, expiresAt: reservation.expiresAt,
            totalAmount: reservation.totalAmount, createdAt: reservation.createdAt, serverTime: new Date(),
            items: reservation.items.map((item) => {
                const type = types.find((entry) => entry.id === item.ticketTypeId);
                if (!type) throw new ConflictException("Thông tin hạng vé không còn hợp lệ");
                return {
                    id: item.ticketTypeId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal,
                    ticketType: { name: type.name, event: { id: type.event.id, name: type.event.name, location: type.event.location }, session: type.session, zone: { name: type.zone.name } },
                    tickets: [],
                };
            }),
        };
    }
    await expireOrder(orderId);
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
            user: {
                select: {
                    email: true,
                    profile: { select: { fullName: true, phone: true } },
                },
            },
            orderItems: { include: { ticketType: { include: { event: true, session: true, zone: true } }, tickets: { include: { seat: true } } } },
        },
    });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    return {
        id: order.id, orderCode: order.orderCode, status: order.status,
        expiresAt: order.expiresAt, totalAmount: order.totalAmount, createdAt: order.createdAt, serverTime: new Date(),
        buyer: order.user ? {
            fullName: order.user.profile?.fullName || null,
            email: order.user.email,
            phone: order.user.profile?.phone || null,
        } : null,
        items: order.orderItems.map((item) => ({
            id: item.id, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal,
            ticketType: {
                id: item.ticketType.id,
                name: item.ticketType.name,
                price: item.ticketType.price,
                event: {
                    id: item.ticketType.event.id,
                    name: item.ticketType.event.name,
                    location: item.ticketType.event.location,
                    thumbnailUrl: item.ticketType.event.thumbnailUrl,
                    bannerUrl: item.ticketType.event.bannerUrl,
                    startAt: item.ticketType.event.startAt,
                    endAt: item.ticketType.event.endAt,
                },
                session: item.ticketType.session,
                zone: { name: item.ticketType.zone.name },
            },
            tickets: order.status === "PAID" ? item.tickets.map((ticket) => ({
                ticketCode: ticket.ticketCode,
                qrToken: ticket.qrToken,
                status: ticket.status,
                seat: ticket.seat ? { rowLabel: ticket.seat.rowLabel, seatNumber: ticket.seat.seatNumber } : null,
            })) : [],
        })),
    };
}

async function listOrders({ userId, page = "1" }) {
    if (!/^[1-9]\d*$/.test(String(page)) || !Number.isSafeInteger(Number(page)) ||
        Number(page) > Math.floor(Number.MAX_SAFE_INTEGER / 20)) {
        throw new BadRequestException("Trang không hợp lệ");
    }
    const currentPage = Number(page);
    const pageSize = 20;
    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where: { userId, status: { in: ["PAID", "REFUNDED"] } },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            select: {
                id: true, orderCode: true, totalAmount: true, status: true,
                expiresAt: true, createdAt: true,
                orderItems: {
                    select: {
                        quantity: true,
                        ticketType: {
                            select: {
                                name: true,
                                session: { select: { startAt: true } },
                                event: { select: { name: true, thumbnailUrl: true, location: true, startAt: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.order.count({ where: { userId, status: { in: ["PAID", "REFUNDED"] } } }),
    ]);
    return { orders, currentPage, totalPages: Math.ceil(total / pageSize) };
}

async function checkout({ userId, orderId }) {
    assertId(orderId);
    await ensurePaymentIndexes();
    const owned = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
    if (!owned) {
        let reservation = await prisma.bookingReservation.findFirst({ where: { id: orderId, userId } });
        if (!reservation) throw new NotFoundException("Không tìm thấy lượt giữ vé");
        if (reservation.status === "PENDING_PAYMENT" && reservation.expiresAt <= new Date()) {
            await expireOrder(orderId);
            reservation = await prisma.bookingReservation.findFirst({ where: { id: orderId, userId } });
        }
        if (reservation.status !== "PENDING_PAYMENT" || reservation.expiresAt <= new Date()) {
            throw new ConflictException("Lượt giữ vé không còn trong thời gian thanh toán");
        }
        await validateBookingReservation(prisma, reservation);
        return paymentService.checkoutFields({ ...reservation, orderCode: reservation.reference });
    }
    await expireOrder(orderId);
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { orderItems: { include: { tickets: { include: { seat: true } }, ticketType: { include: { zone: true } } } } },
    });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    if (order.status !== "PENDING_PAYMENT" || !order.expiresAt || order.expiresAt <= new Date()) {
        throw new ConflictException("Đơn hàng không còn trong thời gian thanh toán");
    }
    if (!await hasValidReservation(prisma, order)) {
        throw new ConflictException("Thông tin giữ vé không hợp lệ; không thể bắt đầu thanh toán");
    }
    return paymentService.checkoutFields(order);
}

module.exports = { startBooking, createOrder, cancelOrder, getOrder, listOrders, checkout, expireDueOrders, expireInTransaction, hasValidReservation, getAvailableSeats, releaseReservationInTransaction, validateBookingReservation, finalizeBookingReservation };
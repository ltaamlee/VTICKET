const crypto = require("node:crypto");
const prisma = require("../../config/prisma");
const { BadRequestException, ConflictException, NotFoundException } = require("../../exceptions");
const { pickSeats } = require("../../utils/seatPicker");
const paymentService = require("../payment/payment.service");
const ensurePaymentIndexes = require("../payment/paymentIndexes");
const JwtUtils = require("../../utils/jwtUtils");

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

async function cancelOrder({ userId, orderId }) {
    assertId(orderId);
    const order = await prisma.$transaction(async (tx) => {
        const owned = await tx.order.findFirst({ where: { id: orderId, userId }, select: { id: true, status: true } });
        if (!owned) throw new NotFoundException("Không tìm thấy đơn hàng");
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
    return prisma.$transaction((tx) => expireInTransaction(tx, orderId, new Date()));
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

async function startBooking({ userId, eventId }) {
    assertId(userId);
    assertId(eventId);
    const event = await prisma.event.findFirst({ where: { id: eventId, status: "APPROVED" } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    const now = new Date();
    if (!event.saleStartAt || event.endAt <= now || !isOpen(event.saleStartAt, event.saleEndAt, now)) {
        throw new ConflictException("Sự kiện hiện không mở bán vé");
    }
    const expiresAt = new Date(Math.floor((now.getTime() + HOLD_MS) / 1000) * 1000);
    return { token: JwtUtils.generateBookingToken({ userId, eventId }, expiresAt), expiresAt, serverTime: now };
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

async function createOrder({ userId, eventId, sessionId, items, bookingToken }) {
    assertId(userId);
    assertId(eventId);
    if (sessionId != null) assertId(sessionId);
    validateItems(items);
    const expiresAt = bookingDeadline(bookingToken, userId, eventId);
    await ensurePaymentIndexes();
    await expireDueOrders(eventId);

    return prisma.$transaction(async (tx) => {
        const now = new Date();
        if (expiresAt <= now) throw new ConflictException("Lượt mua vé đã hết thời gian");
        const event = await tx.event.findUnique({
            where: { id: eventId },
            include: { sessions: true },
        });
        if (!event || event.status !== "APPROVED") throw new NotFoundException("Không tìm thấy sự kiện đang mở bán");
        if (!event.saleStartAt || event.endAt <= now || !isOpen(event.saleStartAt, event.saleEndAt, now)) {
            throw new ConflictException("Sự kiện hiện không mở bán vé");
        }
        const session = event.sessions.find((entry) => entry.id === sessionId);
        if ((event.sessions.length && !session) || (!event.sessions.length && sessionId)) {
            throw new BadRequestException("Vui lòng chọn suất diễn hợp lệ");
        }
        if (session && (session.endAt <= now || !isOpen(session.saleStartAt, session.saleEndAt, now))) {
            throw new ConflictException("Suất diễn hiện không mở bán vé");
        }
        const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const maxTickets = Math.min(event.maxTicketsPerOrder ?? 10, 10);
        if (quantity > maxTickets) {
            throw new BadRequestException(`Mỗi đơn được mua tối đa ${maxTickets} vé`);
        }
        const types = await tx.ticketType.findMany({
            where: { id: { in: items.map((item) => item.ticketTypeId) }, eventId, ...sessionFilter(sessionId) },
            include: { zone: true },
        });
        if (types.length !== items.length) throw new BadRequestException("Hạng vé không thuộc suất diễn đã chọn");
        let totalAmount = 0;
        for (const item of items) {
            const type = types.find((entry) => entry.id === item.ticketTypeId);
            if (type.status !== "ACTIVE" || type.zone.type === "STAGE" ||
                !isOpen(type.saleStartAt, type.saleEndAt, now)) {
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
        const order = await tx.order.create({
            data: {
                userId,
                orderCode: `VT${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
                totalAmount,
                status: totalAmount === 0 ? "PAID" : "PENDING_PAYMENT",
                expiresAt: totalAmount === 0 ? null : expiresAt,
            },
        });
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
                const [allSeats, allocations] = await Promise.all([
                    tx.seat.findMany({ where: { zoneId: type.zoneId, status: "AVAILABLE" } }),
                    tx.seatAllocation.findMany({ where: { key: { startsWith: prefix } }, select: { seatId: true } }),
                ]);
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
                    data: seats.map((seat) => ({ key: `${prefix}${seat.id}`, orderId: order.id, seatId: seat.id })),
                });
            }
            const orderItem = await tx.orderItem.create({
                data: { orderId: order.id, ticketTypeId: type.id, quantity: item.quantity, unitPrice: type.price, subtotal: type.price * item.quantity },
            });
            await tx.ticket.createMany({
                data: Array.from({ length: item.quantity }, (_, index) => ({
                    ticketCode: `T${crypto.randomBytes(16).toString("hex").toUpperCase()}`,
                    qrToken: crypto.randomBytes(32).toString("hex"),
                    userId,
                    eventId,
                    ticketTypeId: type.id,
                    orderItemId: orderItem.id,
                    seatId: seats[index]?.id || null,
                    status: totalAmount === 0 ? "ISSUED" : "RESERVED",
                    issuedAt: totalAmount === 0 ? now : null,
                })),
            });
        }
        return { id: order.id, orderCode: order.orderCode, totalAmount: order.totalAmount, status: order.status, expiresAt: order.expiresAt };
    }).catch((error) => {
        if (error.code === "P2002" || error.code === "P2034") {
            throw new ConflictException("Vé hoặc ghế vừa được người khác giữ, vui lòng chọn lại");
        }
        throw error;
    });
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

async function getOrder({ userId, orderId }) {
    assertId(orderId);
    const owned = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
    if (!owned) throw new NotFoundException("Không tìm thấy đơn hàng");
    await expireOrder(orderId);
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
            orderItems: { include: { ticketType: { include: { event: true, session: true, zone: true } }, tickets: { include: { seat: true } } } },
        },
    });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    return {
        id: order.id, orderCode: order.orderCode, status: order.status,
        expiresAt: order.expiresAt, totalAmount: order.totalAmount, createdAt: order.createdAt, serverTime: new Date(),
        items: order.orderItems.map((item) => ({
            id: item.id, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal,
            ticketType: { name: item.ticketType.name, event: { id: item.ticketType.event.id, name: item.ticketType.event.name, location: item.ticketType.event.location }, session: item.ticketType.session, zone: { name: item.ticketType.zone.name } },
            tickets: order.status === "PAID" ? item.tickets.map((ticket) => ({ ticketCode: ticket.ticketCode, qrToken: ticket.qrToken, seat: ticket.seat ? { rowLabel: ticket.seat.rowLabel, seatNumber: ticket.seat.seatNumber } : null })) : [],
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
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            select: {
                id: true, orderCode: true, totalAmount: true, status: true,
                expiresAt: true, createdAt: true,
                orderItems: { select: { quantity: true, ticketType: { select: { name: true, event: { select: { name: true } } } } } },
            },
        }),
        prisma.order.count({ where: { userId } }),
    ]);
    return { orders, currentPage, totalPages: Math.ceil(total / pageSize) };
}

async function checkout({ userId, orderId }) {
    assertId(orderId);
    await ensurePaymentIndexes();
    const owned = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
    if (!owned) throw new NotFoundException("Không tìm thấy đơn hàng");
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

module.exports = { startBooking, createOrder, cancelOrder, getOrder, listOrders, checkout, expireDueOrders, expireInTransaction, hasValidReservation, getAvailableSeats };
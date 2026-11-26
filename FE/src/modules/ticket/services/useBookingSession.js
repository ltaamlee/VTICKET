import { useEffect, useState } from "react";
import { cancelOrder, getOrder, startBookingSession } from "./orderService";

const pendingResets = new Map();

export function resetBookingOnEventPage(eventId, userId) {
    const key = `vticket-booking:${userId}:${eventId}`;
    if (pendingResets.has(key)) return pendingResets.get(key);
    const reset = (async () => {
        const stored = sessionStorage.getItem(key);
        if (!stored) return false;
        const session = JSON.parse(stored);
        let cancelled = false;
        if (session.orderId) {
            const response = await cancelOrder(session.orderId);
            cancelled = response.data.status === "CANCELLED";
        }
        if (sessionStorage.getItem(key) === stored) sessionStorage.removeItem(key);
        return cancelled;
    })().finally(() => pendingResets.delete(key));
    pendingResets.set(key, reset);
    return reset;
}

export default function useBookingSession(eventId, userId, now) {
    const [session, setSession] = useState(null);
    const [orderStatus, setOrderStatus] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const key = eventId && userId ? `vticket-booking:${userId}:${eventId}` : null;

    useEffect(() => {
        if (!key) return;
        let cancelled = false;
        async function load() {
            try {
                const stored = sessionStorage.getItem(key);
                let value = stored ? JSON.parse(stored) : null;
                if (!value) {
                    const response = await startBookingSession(eventId);
                    if (cancelled) return;
                    value = {
                        token: response.data.token,
                        expiresAt: response.data.expiresAt,
                        offset: new Date(response.data.serverTime).getTime() - Date.now(),
                    };
                    sessionStorage.setItem(key, JSON.stringify(value));
                }
                if (!value.token || !Number.isFinite(new Date(value.expiresAt).getTime()) || !Number.isFinite(value.offset)) {
                    throw new Error("Thông tin lượt mua không hợp lệ. Hãy bắt đầu lại.");
                }
                if (!cancelled) setSession({ ...value, observedAt: Date.now() });
                let status = null;
                if (value.orderId) {
                    const response = await getOrder(value.orderId);
                    if (cancelled) return;
                    const order = response.data;
                    if (order.eventId ? order.eventId !== eventId : !order.items.some((item) => item.ticketType.event.id === eventId)) {
                        throw new Error("Đơn hàng không thuộc sự kiện này.");
                    }
                    status = order.status;
                    if (order.status === "PAID") value.orderId = order.id;
                    if (order.serverTime) value.offset = new Date(order.serverTime).getTime() - Date.now();
                    sessionStorage.setItem(key, JSON.stringify(value));
                }
                if (!cancelled) {
                    setSession({ ...value, observedAt: Date.now() });
                    setOrderStatus(status);
                    setError("");
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Không thể bắt đầu lượt mua vé");
                    setLoading(false);
                }
            }
        }
        load();
        return () => { cancelled = true; };
    }, [key, eventId, attempt]);

    const clockNow = Math.max(now, session?.observedAt || 0);
    const expired = Boolean(session && orderStatus !== "PAID" && (clockNow + session.offset >= new Date(session.expiresAt).getTime() ||
        orderStatus === "EXPIRED" || orderStatus === "CANCELLED"));

    useEffect(() => {
        if (!expired || !session?.orderId || orderStatus !== "PENDING_PAYMENT") return;
        let cancelled = false;
        getOrder(session.orderId).then((response) => {
            if (!cancelled) setOrderStatus(response.data.status);
        }).catch((err) => {
            if (!cancelled) setError(err.message || "Không thể cập nhật trạng thái đơn hàng");
        });
        return () => { cancelled = true; };
    }, [expired, session?.orderId, orderStatus]);

    async function restart() {
        try {
            if (session?.orderId && orderStatus !== "PAID") {
                const response = await getOrder(session.orderId);
                if (response.data.status === "PENDING_PAYMENT") {
                    setError("Đơn hàng vẫn đang giữ vé. Vui lòng chờ hết thời gian hoặc tiếp tục thanh toán.");
                    return false;
                }
            }
            sessionStorage.removeItem(key);
            setSession(null);
            setOrderStatus(null);
            setError("");
            setLoading(true);
            setAttempt((value) => value + 1);
            return true;
        } catch (err) {
            setError(err.message || "Không thể bắt đầu lại lượt mua vé");
            return false;
        }
    }

    function rememberOrder(order) {
        const value = { ...session, orderId: order.id };
        sessionStorage.setItem(key, JSON.stringify(value));
        setSession(value);
        setOrderStatus(order.status);
    }

    return { session, orderStatus, error, loading, expired, restart, rememberOrder, clockNow };
}

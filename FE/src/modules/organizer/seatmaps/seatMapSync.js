const CHANNEL_NAME = "vticket-seat-maps";
const STORAGE_KEY = "vticket-seat-maps-updated";

export function notifySeatMapsChanged() {
    if (typeof BroadcastChannel !== "undefined") {
        try {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage({ type: "changed" });
            channel.close();
            return;
        } catch (error) {
            console.error("Không thể đồng bộ sơ đồ qua BroadcastChannel:", error);
        }
    }

    try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (error) {
        console.error("Không thể đồng bộ sơ đồ qua localStorage:", error);
    }
}

export function subscribeToSeatMapChanges(onChange) {
    let channel;

    if (typeof BroadcastChannel !== "undefined") {
        try {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = (event) => {
                if (event.data?.type === "changed") onChange();
            };
        } catch (error) {
            console.error("Không thể đăng ký đồng bộ BroadcastChannel:", error);
        }
    }

    const handleStorage = (event) => {
        if (event.key === STORAGE_KEY) onChange();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
        channel?.close();
        window.removeEventListener("storage", handleStorage);
    };
}

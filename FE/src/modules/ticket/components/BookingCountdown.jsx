export default function BookingCountdown({ expiresAt, now }) {
    if (!expiresAt || now === null) return null;
    const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, "0");
    return (
        <div className="fixed right-4 top-20 z-40 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg" aria-label={`Thời gian còn lại ${minutes} phút ${seconds} giây`}>
            Thời gian còn lại: {minutes}:{seconds}
        </div>
    );
}

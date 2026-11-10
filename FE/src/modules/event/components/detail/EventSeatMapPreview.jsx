import { Map, Users, DollarSign } from "lucide-react";

/**
 * EventSeatMapPreview - Trực quan hóa sơ đồ chỗ ngồi và các khu vực (Zone)
 */
export default function EventSeatMapPreview({ seatMap }) {
    if (!seatMap) {
        return (
            <div className="rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-xs">
                <Map className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">Không áp dụng sơ đồ chỗ ngồi</h3>
                <p className="mt-1 text-xs text-gray-500">
                    Sự kiện này phát hành vé tự do hoặc không phân chia vị trí cố định trên sơ đồ.
                </p>
            </div>
        );
    }

    const zones = seatMap.zones || [];

    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Map className="h-5 w-5 text-blue-600" />
                    Sơ đồ phân khu & Vị trí chỗ ngồi
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                    Sơ đồ: <span className="font-semibold text-gray-800">{seatMap.name}</span> ({seatMap.canvasWidth}x{seatMap.canvasHeight} px)
                </p>
            </div>

            {/* Trực quan hóa vùng sân khấu & Canvas mini */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-slate-900 p-8 text-center text-white">
                <div className="mx-auto max-w-md rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-6 font-bold text-sm tracking-wider shadow-lg mb-8 uppercase">
                    ★ SÂN KHẤU CHÍNH (STAGE) ★
                </div>

                {/* Danh sách các khu vực hiển thị trực quan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {zones.map((zone) => (
                        <div
                            key={zone.id}
                            className="rounded-xl p-4 text-left border border-white/10 backdrop-blur-md transition hover:scale-102"
                            style={{ backgroundColor: `${zone.color || "#3b82f6"}22` }}
                        >
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="font-bold text-sm text-white flex items-center gap-2">
                                    <span
                                        className="h-3 w-3 rounded-full shrink-0"
                                        style={{ backgroundColor: zone.color || "#3b82f6" }}
                                    />
                                    {zone.name}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                    {zone.type}
                                </span>
                            </div>

                            <div className="space-y-1 text-xs text-gray-300">
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Sức chứa: <strong>{zone.capacity}</strong> chỗ</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Giá tham khảo: <strong>{Number(zone.price || 0).toLocaleString("vi-VN")} đ</strong></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


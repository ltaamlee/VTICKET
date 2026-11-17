import { Map, Layers, Users } from "lucide-react";
import SeatMapPreview from "../../../organizer/components/seatmaps/SeatMapPreview";
import { ZONE_TYPE_LABEL } from "../../../organizer/components/seatmaps/seatmapConstants";

/**
 * EventSeatMapPreview - Trực quan hóa sơ đồ chỗ ngồi chính thức từ Ban tổ chức (BTC)
 */
export default function EventSeatMapPreview({ seatMap }) {
    if (!seatMap) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <Map className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Không áp dụng sơ đồ chỗ ngồi</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Sự kiện này phát hành vé tự do hoặc không phân chia vị trí cố định trên sơ đồ.
                </p>
            </div>
        );
    }

    const zones = seatMap.zones || [];
    const totalCapacity = zones.reduce((sum, z) => {
        if (z.type === "STAGE") return sum;
        const cap = z.type === "SEATED"
            ? (Number(z.rowCount) || 0) * (Number(z.seatPerRow) || 0)
            : Number(z.capacity) || 0;
        return sum + cap;
    }, 0);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Tiêu đề & Thông tin sơ đồ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Map className="h-5 w-5 text-blue-600" />
                        Sơ đồ phân khu & Vị trí chỗ ngồi
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Sơ đồ thiết kế chính thức từ Ban tổ chức: <span className="font-semibold text-slate-800">{seatMap.name}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                        <Layers className="h-3.5 w-3.5" />
                        {zones.length} phân khu
                    </span>
                    {totalCapacity > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            {totalCapacity.toLocaleString("vi-VN")} chỗ
                        </span>
                    )}
                </div>
            </div>

            {/* Sơ đồ trực quan thực tế thiết kế bởi Ban tổ chức */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-6 flex items-center justify-center">
                <div className="w-full max-w-4xl">
                    <SeatMapPreview seatMap={seatMap} className="border-0 shadow-sm" />
                </div>
            </div>

            {/* Bảng phân chú khu vực và giá vé tham khảo */}
            {zones.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-900">
                        Chi tiết các khu vực trên sơ đồ
                    </h3>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Phân khu</th>
                                        <th className="px-4 py-3">Hình thức</th>
                                        <th className="px-4 py-3">Sức chứa</th>
                                        <th className="px-4 py-3 text-right">Giá tham khảo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {zones.map((zone) => {
                                        const isStage = zone.type === "STAGE";
                                        const capacity = zone.type === "SEATED"
                                            ? (Number(zone.rowCount) || 0) * (Number(zone.seatPerRow) || 0)
                                            : Number(zone.capacity) || 0;

                                        return (
                                            <tr key={zone.id} className="hover:bg-slate-50/60 transition">
                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white shadow-xs"
                                                            style={{
                                                                backgroundColor: zone.color || "#3b82f6",
                                                            }}
                                                        />
                                                        {zone.name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                                        {ZONE_TYPE_LABEL[zone.type] || zone.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {isStage ? (
                                                        <span className="text-slate-300">—</span>
                                                    ) : (
                                                        `${capacity.toLocaleString("vi-VN")} chỗ`
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                    {isStage ? (
                                                        <span className="text-slate-300 font-normal">—</span>
                                                    ) : Number(zone.price) > 0 ? (
                                                        <span className="text-blue-600">
                                                            {Number(zone.price).toLocaleString("vi-VN")} đ
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


import { Map, Layers } from "lucide-react";
import SeatMapPreview from "../../../organizer/seatmaps/components/SeatMapPreview";

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

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Tiêu đề & Thông tin sơ đồ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Map className="h-5 w-5 text-blue-600" />
                        Sơ đồ chỗ ngồi
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
                </div>
            </div>

            {/* Sơ đồ trực quan thực tế thiết kế bởi Ban tổ chức */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-6 flex items-center justify-center">
                <div className="w-full max-w-4xl">
                    <SeatMapPreview
                        seatMap={seatMap}
                        className="border-0 shadow-sm"
                        showCapacity={false}
                    />
                </div>
            </div>

        </div>
    );
}


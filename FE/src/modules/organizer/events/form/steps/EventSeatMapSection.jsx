import { Armchair, ExternalLink } from "lucide-react";

import SeatMapPicker from "../../../seatmaps/components/SeatMapPicker";

export default function EventSeatMapSection({
    value,
    onChange,
    onAlert,
    onManageSeatMaps,
    refreshKey = 0,
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Armchair size={17} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800">
                        Sơ đồ ghế
                    </h4>
                </div>

                {onManageSeatMaps && (
                    <button
                        type="button"
                        onClick={onManageSeatMaps}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
                    >
                        Quản lý sơ đồ
                        <ExternalLink size={12} />
                    </button>
                )}
            </div>

            <SeatMapPicker
                value={value}
                onChange={onChange}
                onAlert={onAlert}
                refreshKey={refreshKey}
                label=""
                hint="Sơ đồ ghế được tạo riêng ở tab Quản lý sơ đồ ghế, sau đó chọn để gắn vào sự kiện này."
            />
        </div>
    );
}

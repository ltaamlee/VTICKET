import { CalendarDays } from "lucide-react";

import { inputClass, labelClass } from "../../modals/formStyles";

export default function EventScheduleSection({ formData, handleChange }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 pb-1">
                <CalendarDays size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                    Thời gian sự kiện
                </h3>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
                <h4 className="mb-4 text-sm font-semibold text-gray-800">
                    Thời gian diễn ra
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>
                            Bắt đầu <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="datetime-local"
                            name="startAt"
                            value={formData.startAt}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Kết thúc <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="datetime-local"
                            name="endAt"
                            value={formData.endAt}
                            min={formData.startAt || undefined}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">
                        Thời gian mở bán vé
                    </h4>

                    <p className="mt-1 text-xs text-gray-400">
                        Có thể bỏ trống và cấu hình sau.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>
                            Bắt đầu mở bán
                        </label>

                        <input
                            type="datetime-local"
                            name="saleStartAt"
                            value={formData.saleStartAt}
                            max={formData.startAt || undefined}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Kết thúc mở bán
                        </label>

                        <input
                            type="datetime-local"
                            name="saleEndAt"
                            value={formData.saleEndAt}
                            min={formData.saleStartAt || undefined}
                            max={formData.startAt || undefined}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

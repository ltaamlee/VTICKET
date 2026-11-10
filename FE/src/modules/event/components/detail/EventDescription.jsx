import { Mail, Phone, Info } from "lucide-react";

/**
 * EventDescription - Hiển thị nội dung mô tả chi tiết sự kiện
 */
export default function EventDescription({ description, contactEmail, contactPhone }) {
    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Thông tin chi tiết sự kiện
                </h2>

                {description ? (
                    <div className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                        {description}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-sm">
                        Chưa có mô tả chi tiết cho sự kiện này.
                    </p>
                )}
            </div>

            {/* Thông tin liên hệ hỗ trợ */}
            {(contactEmail || contactPhone) && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 sm:p-8">
                    <h3 className="text-base font-bold text-gray-900 mb-3">
                        Hỗ trợ & Thông tin liên hệ
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                        Nếu bạn có bất kỳ câu hỏi nào về sự kiện, vui lòng liên hệ trực tiếp với Ban tổ chức:
                    </p>

                    <div className="flex flex-wrap gap-6 text-sm text-gray-800">
                        {contactEmail && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <a href={`mailto:${contactEmail}`} className="hover:underline font-medium">
                                    {contactEmail}
                                </a>
                            </div>
                        )}
                        {contactPhone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <a href={`tel:${contactPhone}`} className="hover:underline font-medium">
                                    {contactPhone}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

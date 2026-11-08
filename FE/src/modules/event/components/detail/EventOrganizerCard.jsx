import { Building2, CheckCircle2, Mail, Phone, MapPin, Globe } from "lucide-react";

/**
 * EventOrganizerCard - Hiển thị hồ sơ chi tiết của Ban tổ chức sự kiện
 */
export default function EventOrganizerCard({ organizer }) {
    if (!organizer) return null;

    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Về Ban tổ chức
            </h2>

            <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Logo Ban tổ chức */}
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden shadow-md">
                    {organizer.logo ? (
                        <img
                            src={organizer.logo}
                            alt={organizer.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        (organizer.name || "B").charAt(0).toUpperCase()
                    )}
                </div>

                {/* Thông tin hồ sơ */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{organizer.name}</h3>
                        {organizer.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                                Đã xác minh
                            </span>
                        )}
                    </div>

                    {organizer.description ? (
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {organizer.description}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 italic">
                            Chưa có thông tin giới thiệu chi tiết về đơn vị tổ chức.
                        </p>
                    )}

                    {/* Các kênh liên hệ */}
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-600 border-t border-gray-100">
                        {organizer.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="truncate">{organizer.email}</span>
                            </div>
                        )}
                        {organizer.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                                <span>{organizer.phone}</span>
                            </div>
                        )}
                        {organizer.address && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="truncate">{organizer.address}</span>
                            </div>
                        )}
                        {organizer.website && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                                <a
                                    href={organizer.website.startsWith("http") ? organizer.website : `https://${organizer.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                >
                                    {organizer.website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


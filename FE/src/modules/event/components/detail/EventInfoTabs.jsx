import { Info, Ticket, Map, Building2 } from "lucide-react";

/**
 * EventInfoTabs - Thanh điều hướng các tab nội dung trong trang chi tiết sự kiện
 */
export default function EventInfoTabs({ activeTab, onTabChange, hasSeatMap = false }) {
    const tabs = [
        { id: "overview", label: "Giới thiệu", icon: Info },
        { id: "tickets", label: "Bảng giá & Vé", icon: Ticket },
        ...(hasSeatMap
            ? [{ id: "seatmap", label: "Sơ đồ chỗ ngồi", icon: Map }]
            : []),
        { id: "organizer", label: "Ban tổ chức", icon: Building2 },
    ];

    return (
        <div className="border-b border-gray-200 bg-white sticky top-16 z-20 shadow-xs">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition cursor-pointer ${
                                    isActive
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}


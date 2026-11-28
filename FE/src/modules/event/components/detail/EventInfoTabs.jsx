import { Info, Ticket, Map, Building2 } from "lucide-react";

/**
 * EventInfoTabs - Thanh điều hướng các tab nội dung trong trang chi tiết sự kiện
 */
export default function EventInfoTabs({ activeTab, onTabChange, hasSeatMap = false }) {
    const tabs = [
        { id: "overview", label: "Giới thiệu", icon: Info },
        {
            id: "tickets",
            label: hasSeatMap ? "Bảng giá & Sơ đồ" : "Bảng giá & Vé",
            icon: hasSeatMap ? Map : Ticket,
        },
        { id: "organizer", label: "Ban tổ chức", icon: Building2 },
    ];

    return (
        <div className="border-b border-slate-200 bg-white sticky top-16 z-20 shadow-2xs">
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
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm whitespace-nowrap transition cursor-pointer ${
                                    isActive
                                        ? "border-blue-600 text-blue-600 font-bold"
                                        : "border-transparent text-slate-500 font-medium hover:text-slate-800 hover:border-slate-300"
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}


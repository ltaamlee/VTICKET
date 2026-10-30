import { useState } from "react";

function Tabs({ tabs, defaultTab, onChange }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleChange = (id) => {
        setActiveTab(id);
        onChange?.(id);
    };

    return (
        <div className="w-full overflow-x-auto border-b border-gray-200">
            <div className="flex min-w-max items-center gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleChange(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors ${
                                active
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {Icon && <Icon size={16} strokeWidth={1.8} />}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default Tabs;
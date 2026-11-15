import { NavLink } from "react-router-dom";

const menuItems = [
    {
        label: "Dashboard",
        path: "/organizer/dashboard",
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10Zm0 8h8v-4H3v4Zm12 0h6V11h-6v10Zm0-18v4h6V3h-6Z" />
            </svg>
        ),
    },
    {
        label: "Quản lý sự kiện",
        path: "/organizer/events",
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            </svg>
        ),
    },
    {
        label: "Quản lý vé",
        path: "/organizer/tickets",
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
                <path strokeLinecap="round" strokeDasharray="2 2" d="M12 5v14" />
            </svg>
        ),
    },
];

function OrganizerSidebar({ sidebarOpen, setSidebarOpen, onLogout }) {
    return (
        <div>
            {/* Overlay mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                id="organizer-sidebar"
                aria-label="Sidebar ban tổ chức"
                className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } sm:translate-x-0`}
            >
                <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-3 px-2 py-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
                            V
                        </div>

                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                VTICKET
                            </h1>
                            <p className="text-xs text-gray-500">
                                Organizer Panel
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Đóng sidebar"
                            className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:hidden"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m6 6 12 12M18 6 6 18"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Menu */}
                    <ul className="flex-1 space-y-2 font-medium">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `group flex items-center rounded-lg px-3 py-3 transition-colors ${
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`
                                    }
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                        {item.icon}
                                    </span>

                                    <span className="ml-3 text-sm">
                                        {item.label}
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Đăng xuất */}
                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="group flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"
                                    />
                                </svg>
                            </span>

                            <span className="ml-3">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default OrganizerSidebar;
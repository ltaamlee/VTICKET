import { NavLink } from "react-router-dom";

const menuItems = [
    {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: (
            <svg
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13h8V3H3v10Zm0 8h8v-4H3v4Zm12 0h6V11h-6v10Zm0-18v4h6V3h-6Z"
                />
            </svg>
        ),
    },
    {
        label: "Quản lý người dùng",
        path: "/admin/users",
        icon: (
            <svg
                className="w-6 h-6"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24">
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        ),
    },

    {
        label: "Quản lý danh mục",
        path: "/admin/categories",
        icon: (
            <svg
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.59 13.41 11 3.83H4v7l9.59 9.58a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82ZM7.5 7.5h.01"
                />
            </svg>
        ),
    },

    {
        label: "Quản lý sự kiện",
        path: "/admin/events",
        icon: (
            <svg
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                />
            </svg>
        ),
    },
    {
        label: "Quản lý đơn hàng",
        path: "/admin/orders",
        icon: (
            <svg
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 5h-2a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M8 5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2m-8 8h8m-8 4h8"
                />
            </svg>
        ),
    },
    {
        label: "Quản lý diễn đàn",
        path: "/admin/forum",
        icon: (
            <svg
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h8m-8 4h5m-9 7 3-3h11a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v12l-1 3Z"
                />
            </svg>
        ),
    },
    {
        label: "Quản lý hệ thống",
        path: "/admin/system",
        icon: (
            <svg
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
            </svg>
        ),
    },
];

function AdminSidebar({ sidebarOpen, setSidebarOpen, onLogout }) {
    return (
        <div>
            {/* Overlay mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Nút mở sidebar trên mobile */}
            <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Mở sidebar"
                aria-controls="admin-sidebar"
                aria-expanded={sidebarOpen}
                className="fixed left-4 top-4 z-30 rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm sm:hidden"
            >
                <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        d="M5 7h14M5 12h14M5 17h10"
                    />
                </svg>
            </button>

            {/* Sidebar */}
            <aside
                id="admin-sidebar"
                aria-label="Sidebar quản trị"
                className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                            <p className="text-xs text-gray-500">Admin Panel</p>
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
                                        `group flex items-center rounded-lg px-3 py-3 transition-colors ${isActive
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`
                                    }
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                        {item.icon}
                                    </span>

                                    <span className="ml-3 text-sm">{item.label}</span>
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
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeWidth="2"
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

export default AdminSidebar;
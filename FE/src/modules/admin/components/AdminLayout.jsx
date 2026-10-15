import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";

function AdminLayout() {
const [sidebarOpen, setSidebarOpen] = useState(false);

return (
<div className="min-h-screen bg-gray-50">
<AdminSidebar
open={sidebarOpen}
onClose={() => setSidebarOpen(false)}
/>

  <div className="min-h-screen lg:pl-64">
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="mr-3 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>

      <h1 className="text-lg font-semibold text-gray-800">
        Trang quản trị
      </h1>
    </header>

    <main className="p-4 sm:p-6 lg:p-8">
      <Outlet />
    </main>
  </div>
</div>

);
}

export default AdminLayout;
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  User,
  LayoutDashboard,
  Calendar,
  LogOut,
  ChevronDown,
  Shield,
  Ticket,
  Gem,
  Plus,
  Building2,
  Sparkles,
} from "lucide-react";

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-blue-100/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-2xl font-black tracking-tight text-blue-600 transition hover:opacity-90">
          VTICKET
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-gray-700 transition hover:text-blue-600">
            Trang chủ
          </Link>
          <Link to="/events" className="text-sm font-medium text-gray-700 transition hover:text-blue-600">
            Sự kiện
          </Link>
          <Link to="/forum" className="text-sm font-medium text-gray-700 transition hover:text-blue-600">
            Diễn đàn
          </Link>
          <Link to="/blog" className="text-sm font-medium text-gray-700 transition hover:text-blue-600">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-blue-200/60"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Đăng ký
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:bg-blue-200/60 hover:border-blue-300"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-sm">
                    {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="hidden text-left sm:block">
                  <span className="block max-w-32 truncate text-sm font-semibold text-gray-800">
                    {user?.fullName || "Người dùng"}
                  </span>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${showMenu ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Menu xổ xuống */}
              {showMenu && (
                <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header thẻ user trong dropdown */}
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50/90 p-2.5 mb-2.5">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm">
                        {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {user?.fullName || "Người dùng"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user?.email}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        <Shield className="h-2.5 w-2.5" />
                        {user?.role || "USER"}
                      </span>
                    </div>
                  </div>


                  {/* CÁC LỰA CHỌN MENU */}
                  <div className="space-y-1 text-sm font-medium text-gray-700">
                    {user?.role === "ADMIN" ? (
                      <>
                        {/* Trang quản trị */}
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-purple-50 hover:text-purple-600"
                        >
                          <LayoutDashboard className="h-4 w-4 text-purple-500" />
                          <span>Trang quản trị</span>
                        </Link>

                        {/* Trang cá nhân */}
                        <Link
                          to="/profile"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <User className="h-4 w-4 text-gray-500" />
                          <span>Trang cá nhân</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        {/* Nút Tạo sự kiện (Dành riêng cho Ban Tổ Chức - ORGANIZER) */}
                        {user?.role === "ORGANIZER" && (
                          <div className="mb-2">
                            <Link
                              to="/organizer/dashboard"
                              onClick={() => setShowMenu(false)}
                              className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-2.5 px-4 text-sm font-bold text-white shadow-md transition hover:bg-gray-800"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Tạo sự kiện</span>
                            </Link>
                          </div>
                        )}

                        {/* Vé đã mua */}
                        <Link
                          to="/my-tickets"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Ticket className="h-4 w-4 text-gray-500" />
                          <span>Vé đã mua</span>
                        </Link>

                        {/* Thẻ thành viên */}
                        <Link
                          to="/membership"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Gem className="h-4 w-4 text-gray-500" />
                          <span>Thẻ thành viên</span>
                        </Link>

                        {/* Sự kiện của tôi */}
                        <Link
                          to="/my-events"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Sự kiện của tôi</span>
                        </Link>

                        {/* Trang cá nhân */}
                        <Link
                          to="/profile"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <User className="h-4 w-4 text-gray-500" />
                          <span>Trang cá nhân</span>
                        </Link>

                        {/* Đăng ký làm Ban Tổ Chức (Chỉ hiện khi role là USER) */}
                        {user?.role === "USER" && (
                          <Link
                            to="/organizer/register"
                            onClick={() => setShowMenu(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-blue-600 font-semibold transition hover:bg-blue-50"
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span>Đăng ký làm BTC</span>
                            </div>
                          </Link>
                        )}
                      </>
                    )}
                  </div>

                  <div className="my-2 border-t border-gray-100" />

                  {/* Đăng xuất */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
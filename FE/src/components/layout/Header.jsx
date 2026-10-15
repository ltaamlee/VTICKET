import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="bg-blue-100 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          VTicket
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-gray-700 hover:text-blue-600">
            Trang chủ
          </Link>

          <Link to="/events" className="text-gray-700 hover:text-blue-600">
            Sự kiện
          </Link>

          <Link to="/forum" className="text-gray-700 hover:text-blue-600">
            Diễn đàn
          </Link>

          <Link to="/blog" className="text-gray-700 hover:text-blue-600">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Đăng nhập
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Đăng ký
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-blue-200"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                    {(user?.fullName || user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <span className="max-w-32 truncate text-sm font-semibold text-gray-800">
                  {user?.fullName || user?.email}
                </span>

                <span className="text-xs text-gray-600">▼</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate font-semibold text-gray-800">
                      {user?.fullName || "Người dùng"}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {user?.email}
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      {user?.role}
                    </p>
                  </div>

                  {user?.role === "ADMIN" && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Trang quản trị
                    </Link>
                  )}

                  {user?.role === "ORGANIZER" && (
                    <Link
                      to="/organizer/dashboard"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Quản lý sự kiện
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Hồ sơ cá nhân
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
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
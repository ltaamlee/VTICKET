import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="border-b bg-white">
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
        </nav>

        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}

export default Header;
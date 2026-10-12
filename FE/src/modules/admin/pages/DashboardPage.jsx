import { useState } from "react";
function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Tổng quan
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Chào mừng đến trang quản trị VTicket.
        </p>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng người dùng</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng sự kiện</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng vé</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng đơn hàng</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>

      {/* Hoạt động hệ thống */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Hoạt động hệ thống
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Dữ liệu thống kê sẽ được cập nhật khi kết nối API dashboard từ BE.
        </p>
      </div>
    </div>
  );
}

export default DashboardPage;
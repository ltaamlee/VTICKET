function UserToolbar({ keyword, setKeyword, role, setRole, onReset }) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo email hoặc tên tài khoản..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-md"
        />

        <select
            value={role}
            onChange={(e) => setRole(e.target.value)} 
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" 
            >
                <option value="">Tất cả</option>
                <option value="USER">Khách hàng</option>
                <option value="ORGANIZER">Ban tổ chức</option>
        </select>   

        <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
            Đặt lại
        </button>
    </div>
  );
}

export default UserToolbar;
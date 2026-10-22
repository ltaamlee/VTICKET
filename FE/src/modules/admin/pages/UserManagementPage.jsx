import { useState, useEffect } from "react";
import { getUsers } from "../services/userService";

import UserStats from "../components/users/UserStats";
import UserToolbar from "../components/users/UserToolbar";
import UserTable from "../components/users/UserTable";
import Pagination from "../../../components/common/Pagination";

function UserPage() {
    const [keyword, setKeyword] = useState("");
    const [role, setRole] = useState("");
    const [users, setUsers] = useState([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((prev) => prev + 1);

    useEffect(() => {
        let cancelled = false;

        async function fetchUsers() {
            setLoading(true);
            setError("");

            try {
                const result = await getUsers({
                    page,
                    keyword,
                    role,
                });

                console.log("Bộ lọc:", { page, keyword, role });
                console.log("Kết quả API:", result);

                if (cancelled) return;

                setUsers(result.data || []);
                setTotalPages(result.pagination?.totalPages || 1);
            } catch (err) {
                if (cancelled) return;

                console.error("Lỗi tải danh sách người dùng:", err);

                setError(
                    err.message || "Không thể tải danh sách tài khoản"
                );

                setUsers([]);
                setTotalPages(1);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, [page, keyword, role, refreshKey]);

    const handleKeywordChange = (value) => {
        setKeyword(value);
        setPage(1);
    };

    const handleRoleChange = (value) => {
        setRole(value);
        setPage(1);
    };

    const handleReset = () => {
        setKeyword("");
        setRole("");
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        if (
            newPage >= 1 &&
            newPage <= totalPages &&
            newPage !== page
        ) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý người dùng
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Quản lý tài khoản người dùng và ban tổ chức trên VTICKET.
                </p>
            </div>

            <UserStats />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <UserToolbar
                    keyword={keyword}
                    setKeyword={handleKeywordChange}
                    role={role}
                    setRole={handleRoleChange}
                    onReset={handleReset}
                />

                {error && (
                    <p className="px-5 py-4 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <UserTable
                    users={users}
                    loading={loading}
                    onRefresh={handleRefresh}
                />

                {!loading && !error && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
}

export default UserPage;

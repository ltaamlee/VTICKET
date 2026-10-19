import { useState } from "react";
import IconButton from "../../../../components/common/button/IconButton";

function UserTable({ users = [], loading = false, onRefresh }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null);

    const handleView = (user) => {
        setSelectedUser(user);
        setModalType("view");
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setModalType("edit");
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setModalType("delete");
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        setModalType(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        onRefresh?.();
    };

    const getRoleName = (roleName) => {
        switch (roleName) {
            case "ADMIN":
                return "Admin";
            case "ORGANIZER":
                return "Ban tổ chức";
            case "USER":
                return "Khách hàng";
            default:
                return "Chưa xác định";
        }
    };

    const getRoleStyle = (roleName) => {
        switch (roleName) {
            case "ADMIN":
                return "bg-purple-100 text-purple-700";
            case "ORGANIZER":
                return "bg-blue-100 text-blue-700";
            case "USER":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusName = (status) => {
        switch (status) {
            case "ACTIVE":
                return "Đã kích hoạt";
            case "INACTIVE":
                return "Chưa kích hoạt";
            case "BANNED":
                return "Bị khóa";
            default:
                return status || "Chưa xác định";
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-100 text-green-700";
            case "INACTIVE":
                return "bg-yellow-100 text-orange-700";
            case "BANNED":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-5 py-4">Tài khoản</th>
                            <th className="px-5 py-4">Email</th>
                            <th className="px-5 py-4">Vai trò</th>
                            <th className="px-5 py-4">Trạng thái</th>
                            <th className="px-5 py-4 text-right">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-12 text-center"
                                >
                                    Đang tải danh sách tài khoản...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-12 text-center"
                                >
                                    <p className="mb-2 font-medium text-gray-600">
                                        Chưa có dữ liệu tài khoản
                                    </p>
                                    <p className="text-gray-400">
                                        Không tìm thấy tài khoản phù hợp.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => {
                                const roleName = user.role?.roleName;

                                return (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-900">
                                                {user.username || "Chưa cập nhật"}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                ID: {user.id}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            {user.email}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleStyle(roleName)}`}
                                            >
                                                {getRoleName(roleName)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(user.status)}`}
                                            >
                                                {getStatusName(user.status)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                
                                                <IconButton
                                                    icon="view"
                                                    variant="view"
                                                    title="Xem chi tiết"
                                                    onClick={() => handleView(user)}
                                                />
                                                
                                                <IconButton
                                                    icon="edit"
                                                    variant="edit"
                                                    title="Chỉnh sửa"
                                                    onClick={() => handleEdit(user)}
                                                />

                                                <IconButton
                                                    icon="delete"
                                                    variant="delete"
                                                    title="Xóa"
                                                    onClick={() => handleDelete(user)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {modalType === "view" && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "edit" && (
                <UserEditModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            )}

            {modalType === "delete" && (
                <UserDeleteModal
                    user={selectedUser}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}

export default UserTable;

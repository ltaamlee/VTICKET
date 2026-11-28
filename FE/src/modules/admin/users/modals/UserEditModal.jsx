import { useState, useEffect } from "react";
import { UserCog } from "lucide-react";

import { updateUser } from "../../services/userService";
import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../../components/common/form/FormPanel";

function UserEditModal({ user, onClose, onSuccess }) {
    const [username, setUsername] = useState(user?.username || "");
    const [role, setRole] = useState(user?.role?.roleName || "USER");
    const [status, setStatus] = useState(user?.status || "ACTIVE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;

        setUsername(user.username || "");
        setRole(user.role?.roleName || "USER");
        setStatus(user.status || "ACTIVE");
        setError("");
    }, [user]);

    if (!user) return null;

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError("");

        try {
            await updateUser(user.id, {
                username: username.trim(),
                email: user.email,
                role,
                status,
            });
            onSuccess?.("Cập nhật thông tin người dùng thành công!");
            onClose();
        } catch (err) {
            setError(err.message || "Cập nhật người dùng thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormPanel
            icon={UserCog}
            title="Chỉnh sửa tài khoản"
            subtitle={`Cập nhật vai trò và trạng thái cho ${user.email}`}
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            size="sm"
            submitText="Lưu thay đổi"
        >
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>Email</label>
                <input
                    type="text"
                    disabled
                    value={user.email}
                    className={`${FORM_PANEL_INPUT_CLASS} cursor-not-allowed bg-gray-50 text-gray-500`}
                />
            </div>

            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Tên tài khoản (Username)
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên tài khoản"
                    className={FORM_PANEL_INPUT_CLASS}
                />
            </div>

            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>Vai trò</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={FORM_PANEL_INPUT_CLASS}
                >
                    <option value="USER">Khách hàng (USER)</option>
                    <option value="ORGANIZER">Ban tổ chức (ORGANIZER)</option>
                </select>
            </div>

            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>Trạng thái</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={FORM_PANEL_INPUT_CLASS}
                >
                    <option value="ACTIVE">Đã kích hoạt (ACTIVE)</option>
                    <option value="INACTIVE">Chưa kích hoạt (INACTIVE)</option>
                    <option value="BANNED">Bị khóa (BANNED)</option>
                </select>
            </div>
        </FormPanel>
    );
}

export default UserEditModal;

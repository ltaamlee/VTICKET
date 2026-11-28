import { CheckCircle2 } from "lucide-react";

import ConfirmModal from "../../../../components/common/ConfirmModal";

export default function OrganizerRequestApproveModal({
  show,
  onClose,
  targetRequest,
  onConfirmApprove,
  approving,
}) {
  if (!show || !targetRequest) return null;

  return (
    <ConfirmModal
      isOpen
      onClose={onClose}
      onConfirm={onConfirmApprove}
      title="Xác nhận phê duyệt Ban Tổ Chức?"
      message={`Phê duyệt đơn vị "${targetRequest.organizationName}"?`}
      description={
        <>
          Tài khoản người dùng (
          <strong>{targetRequest.contactEmail}</strong>) sẽ được nâng cấp
          thành vai trò <strong>ORGANIZER</strong> và nhận email chúc mừng.
        </>
      }
      variant="success"
      confirmText="Xác nhận duyệt"
      loading={approving}
    />
  );
}

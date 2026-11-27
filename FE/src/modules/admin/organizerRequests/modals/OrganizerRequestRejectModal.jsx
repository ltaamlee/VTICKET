import { XCircle } from "lucide-react";

import FormPanel, {
    FORM_PANEL_INPUT_CLASS,
    FORM_PANEL_LABEL_CLASS,
} from "../../../../components/common/form/FormPanel";

export default function OrganizerRequestRejectModal({
    show,
    onClose,
    targetRequest,
    rejectReason,
    onRejectReasonChange,
    rejectError,
    onConfirmReject,
    rejecting,
}) {
    if (!show || !targetRequest) return null;

    return (
        <FormPanel
            icon={XCircle}
            title="Từ chối đơn đăng ký Ban Tổ Chức"
            subtitle={`Đơn vị: ${targetRequest.organizationName}`}
            onClose={onClose}
            onSubmit={onConfirmReject}
            loading={rejecting}
            error={rejectError}
            submitText="Xác nhận từ chối"
            submitVariant="danger"
        >
            <div>
                <label className={FORM_PANEL_LABEL_CLASS}>
                    Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => onRejectReasonChange(e.target.value)}
                    placeholder="Ví dụ: Ảnh chụp CCCD bị mờ, không nhìn rõ số định danh cá nhân. Vui lòng chụp lại rõ nét và cập nhật hồ sơ..."
                    className={`${FORM_PANEL_INPUT_CLASS} resize-none focus:border-red-500 focus:ring-red-100`}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                    Lý do này sẽ được gửi trực tiếp tới email của người nộp đơn
                    để họ nắm rõ.
                </p>
            </div>
        </FormPanel>
    );
}

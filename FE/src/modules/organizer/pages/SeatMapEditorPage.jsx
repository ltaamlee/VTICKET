import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

import { Alert } from "../../../components/common/Arlet";
import Button from "../../../components/common/button/Button";
import useSeatMaps from "../seatmaps/editor/hooks/useSeatMaps";
import SeatMapEditor from "../seatmaps/editor/SeatMapEditor";
import { notifySeatMapsChanged } from "../seatmaps/seatMapSync";

function SeatMapEditorPage() {
    const navigate = useNavigate();
    const { seatMapId } = useParams();
    const [alert, setAlert] = useState(null);

    const handleAlert = useCallback((type, message) => {
        setAlert({
            variant: type === "success" ? "success" : "error",
            title: type === "success" ? "Thành công" : "Thất bại",
            message,
            icon: type === "success" ? CheckCircle : XCircle,
        });
    }, []);

    const seatMaps = useSeatMaps({ onAlert: handleAlert });
    const {
        loading,
        seatMaps: maps,
        editorOpen,
        saving,
        handleSave,
        openCreate,
        openEdit,
    } = seatMaps;
    const seatMapExists = maps.some(
        (item) => String(item.id) === seatMapId
    );

    useEffect(() => {
        if (loading || editorOpen) return;

        if (!seatMapId) {
            openCreate();
            return;
        }

        const seatMap = maps.find((item) => String(item.id) === seatMapId);
        if (!seatMap) return;
        openEdit(seatMap);
    }, [
        editorOpen,
        loading,
        maps,
        navigate,
        openCreate,
        openEdit,
        seatMapId,
    ]);

    const handleClose = () => {
        navigate("/organizer/events?tab=seat-maps");
    };

    const handleSaveSeatMap = async (payload) => {
        const saved = await handleSave(payload);
        if (saved) {
            notifySeatMapsChanged();
            navigate("/organizer/events?tab=seat-maps");
        }
    };

    return (
        <div className="space-y-4">
            {alert && (
                <div className="fixed right-5 top-5 z-[60] w-full max-w-sm">
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        icon={alert.icon}
                        duration={alert.variant === "success" ? 3000 : 5000}
                        onClose={() => setAlert(null)}
                        className="shadow-lg"
                    >
                        {alert.message}
                    </Alert>
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="!px-3"
                    aria-label="Quay lại quản lý sơ đồ ghế"
                >
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        {seatMapId ? "Thiết kế sơ đồ ghế" : "Tạo sơ đồ ghế"}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Khu vực thiết kế riêng, giúp thao tác trên sơ đồ thuận tiện hơn.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
                    Đang tải sơ đồ ghế...
                </div>
            ) : seatMapId && !seatMapExists ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    Không tìm thấy sơ đồ ghế cần chỉnh sửa.
                </div>
            ) : !editorOpen ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
                    Đang chuẩn bị trình thiết kế...
                </div>
            ) : (
                <SeatMapEditor
                    seatMap={seatMaps.editingSeatMap}
                    saving={saving}
                    onClose={handleClose}
                    onSave={handleSaveSeatMap}
                    onAlert={handleAlert}
                />
            )}
        </div>
    );
}

export default SeatMapEditorPage;

import { useState, useEffect } from "react";
import { Clock, AlertCircle, Plus, Trash2 } from "lucide-react";
import Button from "../../../../../components/common/button/Button";
import {
    checkTimeConflict,
    createSession,
    deleteSession,
    getSessionsByEventId,
    updateSession,
} from "../../../services/eventSessionService";

const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

function formatDateTime(date) {
    if (!date) return "";
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

function parseDateTime(dateTimeStr) {
    if (!dateTimeStr) return null;
    return new Date(dateTimeStr);
}

export default function EventSessionForm({
    eventId,
    sessions = [],
    onSessionsUpdate,
    onDraftSessionsChange,
    eventStartAt,
    eventEndAt,
    onPendingStateChange,
}) {
    const [formData, setFormData] = useState({
        startAt: "",
        endAt: "",
    });
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [localSessions, setLocalSessions] = useState(sessions);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!eventId) return undefined;

        let cancelled = false;

        getSessionsByEventId(eventId)
            .then((data) => {
                if (!cancelled) {
                    setLocalSessions(Array.isArray(data) ? data : []);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError("Không thể tải danh sách suất diễn");
                }
                console.error(err);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId]);

    const hasPendingSession =
        showForm && Boolean(formData.startAt || formData.endAt);

    useEffect(() => {
        onPendingStateChange?.(hasPendingSession);
    }, [hasPendingSession, onPendingStateChange]);

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError("");
    }

    function resetForm() {
        setFormData({
            startAt: "",
            endAt: "",
        });
        setEditingSessionId(null);
        setShowForm(false);
    }

    async function loadSessions() {
        const data = await getSessionsByEventId(eventId);
        setLocalSessions(Array.isArray(data) ? data : []);
    }

    async function handleSubmit(e) {
        e?.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // Validate times
            if (!formData.startAt || !formData.endAt) {
                setError("Vui lòng nhập thời gian bắt đầu và kết thúc");
                setLoading(false);
                return;
            }

            const startAt = parseDateTime(formData.startAt);
            const endAt = parseDateTime(formData.endAt);

            if (startAt >= endAt) {
                setError(
                    "Thời gian kết thúc phải sau thời gian bắt đầu"
                );
                setLoading(false);
                return;
            }

            if (
                (eventStartAt && startAt < new Date(eventStartAt)) ||
                (eventEndAt && endAt > new Date(eventEndAt))
            ) {
                setError("Suất diễn phải nằm trong thời gian diễn ra sự kiện");
                setLoading(false);
                return;
            }

            if (!eventId) {
                const hasConflict = localSessions.some((session) => {
                    if (session.id === editingSessionId) return false;
                    return (
                        startAt < new Date(session.endAt) &&
                        endAt > new Date(session.startAt)
                    );
                });

                if (hasConflict) {
                    setError("Thời gian này trùng với suất diễn khác");
                    setLoading(false);
                    return;
                }

                const draftSession = {
                    id: editingSessionId || `draft-${Date.now()}`,
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                };
                const nextSessions = editingSessionId
                    ? localSessions.map((session) =>
                          session.id === editingSessionId ? draftSession : session
                      )
                    : [...localSessions, draftSession];

                setLocalSessions(nextSessions);
                onDraftSessionsChange?.(nextSessions);
                setSuccess(
                    editingSessionId
                        ? "Cập nhật suất diễn thành công"
                        : "Đã thêm suất diễn vào sự kiện"
                );
                resetForm();
                return;
            }

            // Check for conflicts
            const conflictCheck = await checkTimeConflict(
                eventId,
                startAt.toISOString(),
                endAt.toISOString(),
                editingSessionId
            );

            if (conflictCheck?.hasConflict) {
                setError("Thời gian này trùng với suất diễn khác");
                setLoading(false);
                return;
            }

            // Create or update session
            const sessionData = {
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
            };

            if (editingSessionId) {
                await updateSession(
                    eventId,
                    editingSessionId,
                    sessionData
                );
                setSuccess("Cập nhật suất diễn thành công");
            } else {
                await createSession(eventId, sessionData);
                setSuccess("Thêm suất diễn thành công");
            }

            await loadSessions();
            resetForm();

            // Call parent callback if provided
            if (onSessionsUpdate) {
                onSessionsUpdate();
            }
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleEditSession(session) {
        setFormData({
            startAt: formatDateTime(session.startAt),
            endAt: formatDateTime(session.endAt),
        });
        setEditingSessionId(session.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleDeleteSession(sessionId) {
        if (window.confirm("Bạn có chắc chắn muốn xóa suất diễn này?")) {
            if (!eventId) {
                const nextSessions = localSessions.filter(
                    (session) => session.id !== sessionId
                );
                setLocalSessions(nextSessions);
                onDraftSessionsChange?.(nextSessions);
                return;
            }

            try {
                setLoading(true);
                await deleteSession(eventId, sessionId);
                setSuccess("Xóa suất diễn thành công");
                await loadSessions();

                if (onSessionsUpdate) {
                    onSessionsUpdate();
                }
            } catch (err) {
                setError(err.message || "Không thể xóa suất diễn");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 pb-1">
                <Clock size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                    Suất diễn sự kiện
                </h3>
            </div>

            {/* Session Form */}
            {showForm && (
                <div className="rounded-xl border border-gray-100 p-5 bg-blue-50">
                    <h4 className="mb-4 text-sm font-semibold text-gray-800">
                        {editingSessionId ? "Chỉnh sửa suất diễn" : "Thêm suất diễn mới"}
                    </h4>

                    {error && (
                        <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-3">
                            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 flex items-start gap-3 rounded-lg bg-green-50 p-3">
                            <div className="text-sm text-green-700">✓ {success}</div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>
                                    Bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startAt"
                                    value={formData.startAt}
                                    onChange={handleInputChange}
                                    min={formatDateTime(eventStartAt) || undefined}
                                    max={formatDateTime(eventEndAt) || undefined}
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endAt"
                                    value={formData.endAt}
                                    min={formData.startAt || undefined}
                                    onChange={handleInputChange}
                                    max={formatDateTime(eventEndAt) || undefined}
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Thời gian mở bán vé được thiết lập chung cho cả sự
                            kiện ở phần Thời gian bên trên.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading
                                    ? "Đang xử lý..."
                                    : editingSessionId
                                    ? "Cập nhật"
                                    : "Thêm"}
                            </Button>
                            <Button
                                type="button"
                                onClick={resetForm}
                                variant="secondary"
                                className="flex-1"
                                disabled={loading}
                            >
                                Hủy
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Session Button */}
            {!showForm && (
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    Thêm suất diễn
                </button>
            )}

            {/* Sessions List */}
            {localSessions.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-800">
                            Danh sách suất diễn ({localSessions.length})
                        </h4>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {localSessions.map((session) => (
                            <div
                                key={session.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="grid gap-3 sm:grid-cols-3 items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                            Thời gian
                                        </p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(
                                                session.startAt
                                            ).toLocaleDateString("vi-VN", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}{" "}
                                            -{" "}
                                            {new Date(
                                                session.endAt
                                            ).toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                            Thời lượng
                                        </p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {Math.round(
                                                (new Date(session.endAt) -
                                                    new Date(session.startAt)) /
                                                    60000
                                            )}{" "}
                                            phút
                                        </p>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEditSession(session)
                                            }
                                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                            disabled={loading}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteSession(session.id)
                                            }
                                            className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {localSessions.length === 0 && !showForm && (
                <div className="rounded-xl border border-gray-200 border-dashed p-8 text-center">
                    <Clock size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500 mb-3">
                        Chưa có suất diễn nào
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                        Thêm suất diễn để khách hàng có thể chọn giờ phù hợp
                    </p>
                </div>
            )}
        </div>
    );
}

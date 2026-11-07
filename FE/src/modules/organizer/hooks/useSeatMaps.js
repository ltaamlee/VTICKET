import { useCallback, useEffect, useState } from "react";

import {
    getSeatMaps,
    createSeatMap,
    updateSeatMap,
    duplicateSeatMap,
    deleteSeatMap,
} from "../services/seatMapService";

export default function useSeatMaps({ onAlert, refreshKey = 0, onChange }) {
    const [seatMaps, setSeatMaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingSeatMap, setEditingSeatMap] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchSeatMaps = useCallback(async () => {
        setLoading(true);

        try {
            const result = await getSeatMaps();

            setSeatMaps(result?.data?.seatMaps || []);

            onChange?.();
        } catch (err) {
            console.error("Lỗi tải danh sách sơ đồ sự kiện:", err);

            onAlert?.(
                "error",
                err.response?.data?.message ||
                    err.message ||
                    "Không thể tải danh sách sơ đồ sự kiện."
            );

            setSeatMaps([]);
        } finally {
            setLoading(false);
        }
    }, [onAlert, onChange]);

    useEffect(() => {
        fetchSeatMaps();
    }, [fetchSeatMaps, refreshKey]);

    const openCreate = useCallback(() => {
        setEditingSeatMap(null);
        setEditorOpen(true);
    }, []);

    const openEdit = useCallback((seatMap) => {
        setEditingSeatMap(seatMap);
        setEditorOpen(true);
    }, []);

    const closeEditor = useCallback(() => {
        setEditorOpen(false);
        setEditingSeatMap(null);
    }, []);

    const handleSave = useCallback(
        async (payload) => {
            try {
                setSaving(true);

                if (editingSeatMap) {
                    await updateSeatMap(editingSeatMap.id, payload);
                    onAlert?.("success", "Cập nhật sơ đồ sự kiện thành công.");
                } else {
                    await createSeatMap(payload);
                    onAlert?.("success", "Tạo sơ đồ sự kiện thành công.");
                }

                closeEditor();

                await fetchSeatMaps();
            } catch (err) {
                onAlert?.(
                    "error",
                    err.response?.data?.message ||
                        err.message ||
                        "Không thể lưu sơ đồ sự kiện."
                );
            } finally {
                setSaving(false);
            }
        },
        [editingSeatMap, onAlert, closeEditor, fetchSeatMaps]
    );

    /** Nhân bản sơ đồ ghế (tạo bản sao mới để chỉnh sửa). */
    const handleDuplicate = useCallback(
        async (seatMap) => {
            if (!seatMap?.id) return;

            try {
                await duplicateSeatMap(seatMap.id);

                onAlert?.(
                    "success",
                    `Đã nhân bản sơ đồ "${seatMap.name}".`
                );

                await fetchSeatMaps();
            } catch (err) {
                onAlert?.(
                    "error",
                    err.response?.data?.message ||
                        err.message ||
                        "Không thể nhân bản sơ đồ sự kiện."
                );
            }
        },
        [onAlert, fetchSeatMaps]
    );

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;

        try {
            setDeleting(true);

            await deleteSeatMap(deleteTarget.id);

            onAlert?.("success", "Xóa sơ đồ sự kiện thành công.");

            setDeleteTarget(null);

            await fetchSeatMaps();
        } catch (err) {
            onAlert?.(
                "error",
                err.response?.data?.message ||
                    err.message ||
                    "Không thể xóa sơ đồ sự kiện."
            );
        } finally {
            setDeleting(false);
        }
    }, [deleteTarget, onAlert, fetchSeatMaps]);

    return {
        seatMaps,
        loading,
        saving,
        deleting,
        editorOpen,
        editingSeatMap,
        deleteTarget,
        openCreate,
        openEdit,
        closeEditor,
        setDeleteTarget,
        handleSave,
        handleDelete,
        handleDuplicate,
        refresh: fetchSeatMaps,
    };
}
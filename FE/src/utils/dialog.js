/**
 * Light-dismiss fallback for native <dialog closedby="any"> when browser lacks HTMLDialogElement.closedBy support.
 */
export function handleDialogBackdropClick(event, dialog, onClose) {
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    if (event.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

    if (!isInside) {
        onClose?.();
    }
}


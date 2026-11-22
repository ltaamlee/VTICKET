
import { useRef } from "react";

import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Quote,
    Link as LinkIcon,
    Unlink,
    Minus,
    RemoveFormatting,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Heading3,
    Pilcrow,
    ImagePlus,
} from "lucide-react";

const BUTTON_CLASS =
    "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30";

const ACTIVE_CLASS = "bg-blue-100 text-blue-700";
const INACTIVE_CLASS = "text-gray-600";

function ToolbarButton({
    icon: Icon,
    title,
    active = false,
    disabled = false,
    onClick,
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`${BUTTON_CLASS} ${
                active ? ACTIVE_CLASS : INACTIVE_CLASS
            }`}
        >
            <Icon size={15} strokeWidth={1.8} />
        </button>
    );
}

function Divider() {
    return <div className="mx-1 h-5 w-px bg-gray-200" />;
}

export default function TextEditorToolbar({
    editor,
    onImageUpload,
}) {
    const imageInputRef = useRef(null);

    if (!editor) return null;

    const handleInsertLink = () => {
        const previousUrl = editor.getAttributes("link").href || "";

        const url = window.prompt(
            "Nhập địa chỉ liên kết (URL):",
            previousUrl || "https://"
        );

        if (url === null || !url.trim()) return;

        let finalUrl = url.trim();

        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = `https://${finalUrl}`;
        }

        try {
            const parsedUrl = new URL(finalUrl);

            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                return;
            }
        } catch {
            return;
        }

        const attrs = {
            href: finalUrl,
            target: "_blank",
            rel: "noopener noreferrer",
        };

        if (editor.state.selection.empty) {
            editor.chain().focus().insertContent({
                type: "text",
                text: finalUrl,
                marks: [
                    {
                        type: "link",
                        attrs,
                    },
                ],
            }).run();
        } else {
            editor.chain().focus().setLink(attrs).run();
        }
    };

    const handleImageSelect = async (event) => {
        const file = event.target.files?.[0];

        // Cho phép chọn lại cùng một ảnh
        event.target.value = "";

        if (!file) return;

        await onImageUpload?.(file);
    };

    const clearFormatting = () => {
        editor.chain()
            .focus()
            .unsetAllMarks()
            .clearNodes()
            .run();
    };

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">

            {/* BLOCK FORMAT */}

            <ToolbarButton
                icon={Pilcrow}
                title="Đoạn văn"
                active={editor.isActive("paragraph")}
                onClick={() =>
                    editor.chain().focus().setParagraph().run()
                }
            />

            <ToolbarButton
                icon={Heading1}
                title="Tiêu đề lớn (H1)"
                active={editor.isActive("heading", { level: 1 })}
                onClick={() =>
                    editor.chain().focus()
                        .toggleHeading({ level: 1 }).run()
                }
            />

            <ToolbarButton
                icon={Heading2}
                title="Tiêu đề vừa (H2)"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() =>
                    editor.chain().focus()
                        .toggleHeading({ level: 2 }).run()
                }
            />

            <ToolbarButton
                icon={Heading3}
                title="Tiêu đề nhỏ (H3)"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() =>
                    editor.chain().focus()
                        .toggleHeading({ level: 3 }).run()
                }
            />

            <Divider />

            {/* TEXT STYLE */}

            <ToolbarButton
                icon={Bold}
                title="In đậm (Ctrl+B)"
                active={editor.isActive("bold")}
                onClick={() =>
                    editor.chain().focus().toggleBold().run()
                }
            />

            <ToolbarButton
                icon={Italic}
                title="In nghiêng (Ctrl+I)"
                active={editor.isActive("italic")}
                onClick={() =>
                    editor.chain().focus().toggleItalic().run()
                }
            />

            <ToolbarButton
                icon={Underline}
                title="Gạch chân (Ctrl+U)"
                active={editor.isActive("underline")}
                onClick={() =>
                    editor.chain().focus().toggleUnderline().run()
                }
            />

            <ToolbarButton
                icon={Strikethrough}
                title="Gạch ngang chữ"
                active={editor.isActive("strike")}
                onClick={() =>
                    editor.chain().focus().toggleStrike().run()
                }
            />

            <Divider />

            {/* LIST */}

            <ToolbarButton
                icon={List}
                title="Danh sách dấu chấm"
                active={editor.isActive("bulletList")}
                onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                }
            />

            <ToolbarButton
                icon={ListOrdered}
                title="Danh sách đánh số"
                active={editor.isActive("orderedList")}
                onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                }
            />

            <ToolbarButton
                icon={Quote}
                title="Khối trích dẫn"
                active={editor.isActive("blockquote")}
                onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                }
            />

            <Divider />

            {/* ALIGNMENT */}

            <ToolbarButton
                icon={AlignLeft}
                title="Căn trái"
                active={
                    editor.isActive("paragraph", { textAlign: "left" }) ||
                    editor.isActive("heading", { textAlign: "left" })
                }
                onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                }
            />

            <ToolbarButton
                icon={AlignCenter}
                title="Căn giữa"
                active={
                    editor.isActive("paragraph", { textAlign: "center" }) ||
                    editor.isActive("heading", { textAlign: "center" })
                }
                onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                }
            />

            <ToolbarButton
                icon={AlignRight}
                title="Căn phải"
                active={
                    editor.isActive("paragraph", { textAlign: "right" }) ||
                    editor.isActive("heading", { textAlign: "right" })
                }
                onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                }
            />

            <Divider />

            {/* LINK */}

            <ToolbarButton
                icon={LinkIcon}
                title="Chèn liên kết"
                active={editor.isActive("link")}
                onClick={handleInsertLink}
            />

            <ToolbarButton
                icon={Unlink}
                title="Gỡ liên kết"
                disabled={!editor.isActive("link")}
                onClick={() =>
                    editor.chain().focus().unsetLink().run()
                }
            />

            <Divider />

            {/* IMAGE */}

            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
            />

            <ToolbarButton
                icon={ImagePlus}
                title="Chèn hình ảnh"
                disabled={!onImageUpload}
                onClick={() => imageInputRef.current?.click()}
            />

            <ToolbarButton
                icon={Minus}
                title="Đường kẻ ngang"
                onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                }
            />

            <Divider />

            {/* UTILITIES */}

            <ToolbarButton
                icon={RemoveFormatting}
                title="Xóa định dạng"
                onClick={clearFormatting}
            />

            <ToolbarButton
                icon={Undo}
                title="Hoàn tác (Ctrl+Z)"
                disabled={!editor.can().undo()}
                onClick={() =>
                    editor.chain().focus().undo().run()
                }
            />

            <ToolbarButton
                icon={Redo}
                title="Làm lại (Ctrl+Y)"
                disabled={!editor.can().redo()}
                onClick={() =>
                    editor.chain().focus().redo().run()
                }
            />
        </div>
    );
}
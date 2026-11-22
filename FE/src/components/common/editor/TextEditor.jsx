
import { useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";

import DOMPurify from "dompurify";

import TextEditorToolbar from "./TextEditorToolbar";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// API URL: ví dụ http://localhost:5000/api/v1
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function TextEditor({
    name = "description",
    value = "",
    onChange,
    placeholder = "Giới thiệu nội dung, lịch trình, khách mời sự kiện...",
    minHeight = 160,
    className = "",
}) {
    const propsRef = useRef({ name, onChange });

    propsRef.current = { name, onChange };

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),

            Underline,

            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    target: "_blank",
                    rel: "noopener noreferrer",
                },
            }),

            TextAlign.configure({
                types: ["heading", "paragraph"],
                alignments: ["left", "center", "right"],
                defaultAlignment: "left",
            }),

            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: "my-3 max-w-full rounded-lg",
                },
            }),

            Placeholder.configure({
                placeholder,
                emptyEditorClass: "is-editor-empty",
            }),
        ],
        [placeholder]
    );

    const editor = useEditor({
        immediatelyRender: false,

        extensions,

        content: value
            ? DOMPurify.sanitize(value)
            : "<p></p>",

        editorProps: {
            attributes: {
                class: [
                    "tiptap",
                    "outline-none",
                    "px-4 py-3",
                    "text-sm leading-relaxed text-gray-800",
                    "min-h-full",
                    "[&_p]:my-1",
                    "[&_h1]:my-2 [&_h1]:text-xl [&_h1]:font-bold",
                    "[&_h2]:my-1.5 [&_h2]:text-lg [&_h2]:font-bold",
                    "[&_h3]:my-1 [&_h3]:text-base [&_h3]:font-semibold",
                    "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6",
                    "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-6",
                    "[&_blockquote]:my-2",
                    "[&_blockquote]:border-l-4",
                    "[&_blockquote]:border-blue-400",
                    "[&_blockquote]:pl-3",
                    "[&_blockquote]:italic",
                    "[&_blockquote]:text-gray-600",
                    "[&_a]:text-blue-600 [&_a]:underline",
                    "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg",
                    "[&_hr]:my-3 [&_hr]:border-gray-200",
                    "[&_.is-editor-empty:first-child::before]:pointer-events-none",
                    "[&_.is-editor-empty:first-child::before]:float-left",
                    "[&_.is-editor-empty:first-child::before]:h-0",
                    "[&_.is-editor-empty:first-child::before]:text-gray-400",
                    "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                ].join(" "),
            },
        },

        onUpdate: ({ editor }) => {
            const html = editor.getHTML();

            const sanitized = editor.isEmpty
                ? ""
                : DOMPurify.sanitize(html);

            propsRef.current.onChange?.({
                target: {
                    name: propsRef.current.name,
                    value: sanitized,
                },
            });
        },
    });

    // Đồng bộ dữ liệu từ component cha
    useEffect(() => {
        if (!editor) return;

        const safeHtml = value
            ? DOMPurify.sanitize(value)
            : "";

        const currentHtml = editor.isEmpty
            ? ""
            : DOMPurify.sanitize(editor.getHTML());

        if (safeHtml !== currentHtml) {
            editor.commands.setContent(
                safeHtml || "<p></p>",
                { emitUpdate: false }
            );
        }
    }, [editor, value]);

    // Upload ảnh lên backend -> Cloudinary
    const handleImageUpload = async (file) => {
        if (!editor || !file) return;

        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn tệp hình ảnh hợp lệ.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert("Dung lượng ảnh không được vượt quá 5MB.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/upload/image`, {
                method: "POST",
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {},
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Không thể tải ảnh lên."
                );
            }

            const imageUrl =
                result.data?.url ||
                result.url ||
                result.data?.secure_url;

            if (!imageUrl) {
                throw new Error("Không tìm thấy URL ảnh từ máy chủ.");
            }

            editor
                .chain()
                .focus()
                .setImage({
                    src: imageUrl,
                    alt: file.name,
                })
                .run();
        } catch (error) {
            console.error("[TextEditor Image Upload]:", error);
            alert(error.message || "Tải ảnh lên thất bại.");
        }
    };

    return (
        <div
            className={`
                overflow-hidden rounded-xl border border-gray-200
                bg-white transition
                focus-within:border-blue-400
                focus-within:ring-2 focus-within:ring-blue-50
                ${className}
            `}
        >
            {/* TOOLBAR */}
            <TextEditorToolbar
                editor={editor}
                onImageUpload={handleImageUpload}
            />

            {/* EDITOR */}
            <div
                className="max-h-[380px] overflow-y-auto"
                style={{ minHeight: `${minHeight}px` }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

export default TextEditor;
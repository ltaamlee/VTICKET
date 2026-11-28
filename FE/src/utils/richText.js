import DOMPurify from "dompurify";

export function isHtmlContent(value) {
    return typeof value === "string" && /<[a-z][\s\S]*>/i.test(value);
}


export function stripHtml(value) {
    if (typeof value !== "string") return "";

    if (!isHtmlContent(value)) return value;

    const sanitized = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });

    return sanitized
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function truncateText(value, maxLength = 140, suffix = "...") {
    const text = stripHtml(value);

    if (!text) return "";
    if (text.length <= maxLength) return text;

    return `${text.slice(0, maxLength).trimEnd()}${suffix}`;
}


export const RICH_TEXT_CLASS = [
    "text-sm leading-relaxed",
    "[&_p]:my-1.5",
    "[&_h1]:my-2.5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900",
    "[&_h2]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-800",
    "[&_h3]:my-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800",
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600",
    "[&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-700",
    "[&_strong]:font-semibold",
    "[&_u]:underline",
    "[&_s]:line-through",
    "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg",
    "[&_hr]:my-3 [&_hr]:border-slate-200",
].join(" ");

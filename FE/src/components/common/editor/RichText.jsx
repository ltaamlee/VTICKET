import DOMPurify from "dompurify";

import { isHtmlContent, RICH_TEXT_CLASS } from "../../../utils/richText";

export default function RichText({
    html,
    className = "",
    emptyText = "",
}) {
    if (!html) {
        return emptyText ? (
            <p className="text-sm italic text-slate-400">{emptyText}</p>
        ) : null;
    }

    if (!isHtmlContent(html)) {
        return (
            <div
                className={`whitespace-pre-line text-sm leading-relaxed text-slate-700 ${className}`}
            >
                {html}
            </div>
        );
    }

    return (
        <div
            className={`${RICH_TEXT_CLASS} ${className}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
    );
}

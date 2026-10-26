import { Eye, Pencil, Trash2, Lock, Unlock } from "lucide-react";

const icons = {
    view: Eye,
    edit: Pencil,
    delete: Trash2,
    lock: Lock,
    unlock: Unlock,
};

const variants = {
    view: "bg-blue-50 text-blue-600 hover:bg-blue-600",
    edit: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600",
    delete: "bg-red-50 text-red-600 hover:bg-red-600",
    lock: "bg-amber-50 text-amber-600 hover:bg-amber-600",
    unlock: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600",
};

function IconButton({
    icon = "view",
    variant = "view",
    title = "",
    onClick,
    size = 18,
    disabled = false,
    color,
    hoverColor,
    bgColor,
    hoverBgColor,
    className = "",
}) {
    const Icon = icons[icon] || Eye;

    const colorStyle = {
        color,
        backgroundColor: bgColor,
    };

    const hoverStyle = {
        "--icon-hover-color": hoverColor || "#ffffff",
        "--icon-hover-bg": hoverBgColor,
    };

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={title || icon}
            disabled={disabled}
            title={title || undefined}
            style={{
                ...colorStyle,
                ...hoverStyle,
            }}
            className={`group relative inline-flex h-8 w-8 shrink-0
                items-center justify-center rounded-full
                transition-colors duration-200
                ${!color && !bgColor ? variants[variant] || variants.view : ""}
                hover:[color:var(--icon-hover-color)]
                ${hoverBgColor ? "hover:[background-color:var(--icon-hover-bg)]" : ""}
                disabled:cursor-not-allowed disabled:opacity-50
                ${className}`}
        >
            <Icon size={size} strokeWidth={1.8} aria-hidden="true" />

            {title && (
                <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full
                        left-1/2 z-50 mb-2 -translate-x-1/2
                        translate-y-1 whitespace-nowrap rounded-md
                        bg-gray-800 px-2.5 py-1.5 text-xs font-medium
                        text-white opacity-0 shadow-lg transition-all
                        duration-200 group-hover:translate-y-0
                        group-hover:opacity-100"
                >
                    {title}
                    <span className="absolute left-1/2 top-full
                        -translate-x-1/2 border-4 border-transparent
                        border-t-gray-800" />
                </span>
            )}
        </button>
    );
}

export default IconButton;
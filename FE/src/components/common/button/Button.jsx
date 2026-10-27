import { LoaderCircle } from "lucide-react";

const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
        "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    outline:
        "border border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
};

function Button({
    children,
    variant = "primary",
    size = "md",
    type = "button",
    onClick,
    disabled = false,
    loading = false,
    color,
    hoverColor,
    bgColor,
    hoverBgColor,
    icon: Icon,
    iconPosition = "left",
    iconSize = 18,
    className = "",
    ...props
}) {
    const colorStyle = {
        color,
        backgroundColor: bgColor,
    };

    const hoverStyle = {
        "--button-hover-color": hoverColor || "inherit",
        "--button-hover-bg": hoverBgColor || "transparent",
    };

    const isCustomColor = Boolean(color || bgColor);

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                ...colorStyle,
                ...hoverStyle,
            }}
            className={`group inline-flex shrink-0 items-center
                justify-center rounded-lg font-medium
                transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-500 focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                ${sizes[size] || sizes.md}
                ${!isCustomColor ? variants[variant] || variants.primary : ""}
                ${hoverBgColor ? "hover:text-(--button-hover-color" : ""}
                ${hoverColor ? "hover:text-(--button-hover-color" : ""}
                ${className}`}
            {...props}
        >
            {loading ? (
                <LoaderCircle
                    size={iconSize}
                    className="shrink-0 animate-spin"
                    aria-hidden="true"
                />
            ) : (
                Icon && iconPosition === "left" && (
                    <Icon size={iconSize} aria-hidden="true" />
                )
            )}

            {children}

            {!loading && Icon && iconPosition === "right" && (
                <Icon size={iconSize} aria-hidden="true" />
            )}
        </button>
    );
}

export default Button;
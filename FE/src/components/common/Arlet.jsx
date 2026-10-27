
import { forwardRef, useEffect} from "react";

const variants = {
    primary: "border-blue-200 bg-blue-50 text-blue-700",
    secondary: "border-gray-200 bg-gray-50 text-gray-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const Alert = forwardRef(function Alert(
    {
        variant = "primary",
        title,
        children,
        icon: Icon,
        color,
        bgColor,
        borderColor,
        className = "",
        duration = 3000,
        onClose,
        ...props
    },
    ref
) {

    useEffect(() => {
        if ( !onClose || duration <=0 ) return;

        const timer = setTimeout(() =>{
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const customStyle = {
        ...(color && { color }),
        ...(bgColor && { backgroundColor: bgColor }),
        ...(borderColor && { borderColor }),
    };

    return (
        <div
            ref={ref}
            role="alert"
            style={customStyle}
            className={[
                "flex items-start gap-3 rounded-lg border p-4",
                variants[variant] || variants.primary,
                className,
            ].join(" ")}
            {...props}
        >
            {Icon && (
                <Icon
                    size={20}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                />
            )}

            <div className="min-w-0 flex-1">
                {title && (
                    <h5 className="mb-1 font-semibold leading-tight">
                        {title}
                    </h5>
                )}

                <div className="text-sm leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
});

const AlertTitle = forwardRef(function AlertTitle(
    { className = "", ...props },
    ref
) {
    return (
        <h5
            ref={ref}
            className={`mb-1 font-semibold leading-tight ${className}`}
            {...props}
        />
    );
});

const AlertDescription = forwardRef(function AlertDescription(
    { className = "", ...props },
    ref
) {
    return (
        <div
            ref={ref}
            className={`text-sm leading-relaxed ${className}`}
            {...props}
        />
    );
});

export { Alert, AlertTitle, AlertDescription };
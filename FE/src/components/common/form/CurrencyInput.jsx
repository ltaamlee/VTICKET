import { useEffect, useState } from "react";

import { formatVNDNumber, parseVND } from "../../../utils/formatCurrency";

function CurrencyInput({
    value = 0,
    onChange,
    disabled = false,
    placeholder = "0",
    className = "",
    id,
    name,
    min = 0,
    max,
    ...props
}) {
    const [display, setDisplay] = useState(() =>
        formatVNDNumber(value)
    );
    const [focused, setFocused] = useState(false);

    // Đồng bộ khi giá trị bên ngoài thay đổi và không đang focus.
    useEffect(() => {
        if (focused) return;

        setDisplay(formatVNDNumber(value));
    }, [value, focused]);

    const handleChange = (event) => {
        const raw = event.target.value;

        // Cho phép xoá hết để gõ lại từ đầu.
        if (raw === "") {
            setDisplay("");
            onChange?.(0);
            return;
        }

        const parsed = parseVND(raw);

        setDisplay(formatVNDNumber(parsed));
        onChange?.(parsed);
    };

    const handleFocus = () => {
        setFocused(true);

        // Khi focus thì hiện số thô cho dễ sửa.
        setDisplay(value ? String(value) : "");
    };

    const handleBlur = () => {
        setFocused(false);

        const parsed = parseVND(display);

        setDisplay(formatVNDNumber(parsed));
        onChange?.(parsed);
    };

    return (
        <input
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
            min={min}
            max={max}
            {...props}
        />
    );
}

export default CurrencyInput;
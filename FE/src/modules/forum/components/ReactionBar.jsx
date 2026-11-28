import { REACTION_OPTIONS } from "../utils/forumHelpers";

function ReactionBar({
    reactions,
    onReact,
    disabled = false,
    showLabels = false,
}) {
    const counts = reactions?.counts || {};
    const myReaction = reactions?.myReaction || null;
    const total = reactions?.total ?? 0;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {REACTION_OPTIONS.map((option) => {
                const count = counts[option.type] || 0;
                const isActive = myReaction === option.type;

                return (
                    <button
                        key={option.type}
                        type="button"
                        disabled={disabled}
                        aria-pressed={isActive}
                        aria-label={`${option.label}${count > 0 ? ` (${count})` : ""}`}
                        onClick={() => onReact?.(option.type)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                                ? option.activeClass
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                        <span aria-hidden="true" className="text-sm leading-none">
                            {option.emoji}
                        </span>
                        {showLabels && <span>{option.label}</span>}
                        {count > 0 && (
                            <span className="tabular-nums font-semibold">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}

            {showLabels && total > 0 && (
                <span className="ml-1 text-xs text-slate-500">
                    {total} cảm xúc
                </span>
            )}
        </div>
    );
}

export default ReactionBar;


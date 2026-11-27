import EmojiPickerReact from "emoji-picker-react";

function EmojiPicker({ onSelect }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <EmojiPickerReact
                onEmojiClick={(emojiData) => onSelect?.(emojiData.emoji)}
                searchPlaceholder="Tìm kiếm biểu tượng cảm xúc"
                width={320}
                height={360}
                previewConfig={{ showPreview: false }}
            // lazyLoadEmojis={true}
            />
        </div>
    );
}

export default EmojiPicker;

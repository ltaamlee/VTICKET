import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert } from "../../../components/common/Arlet";

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

function ForumNotice({ notice, onDismiss }) {
    if (!notice?.message) return null;

    const variant = notice.type === "success" || notice.type === "error" ? notice.type : "info";
    const Icon = ICONS[variant] || Info;

    return (
        <div className="fixed right-5 top-5 z-[60] w-[calc(100%-2.5rem)] max-w-sm">
            <Alert
                variant={variant}
                icon={Icon}
                duration={4500}
                onClose={onDismiss}
                className="shadow-lg"
            >
                {notice.message}
            </Alert>
        </div>
    );
}

export default ForumNotice;

/*  
    General Setting: logo, title, email, maintenance
    Pagination - Display
    Setting: số lần đăng nhập tối đa, giới hạn phiên đăng nhập
    Notification: bật/ tắt email, nội dung email mẫu để gửi ticket cho khách hàng
    Payment: Phương thức thanh toán hỗ trợ, phí giao dịch
    Audit log
 */
import { useState } from "react";
import {
    Settings,
    CreditCard,
    ShieldCheck,
    Bell,
    SlidersHorizontal,
} from "lucide-react";

import { Alert } from "../../../components/common/Arlet";
import Tabs from "../../../components/common/Tabs";

import General from "../../admin/components/system/General";
// import Payment from "../../admin/components/system/PaymentSetting";
// import Security from "../../admin/components/system/Security";
// import Notifications from "../../admin/components/system/Notifications";

const tabs = [
    { id: "general", label: "General Settings", icon: Settings, content: General },
    // { id: "payment", label: "Payment", icon: CreditCard, content: Payment },
    // { id: "security", label: "Security", icon: ShieldCheck, content: Security },
    // { id: "notifications", label: "Notifications", icon: Bell, content: Notifications },
    // { id: "system", label: "System", icon: SlidersHorizontal, content: System },
];

function SystemPage() {
    const [activeTab, setActiveTab] = useState("general");

    const [alert, setAlert] = useState(null);

    const ActiveContent =
        tabs.find((tab) => tab.id === activeTab)?.content;

    return (

        <div className="space-y-5">

            {alert && (
                <div className="fixed right-5 top-5 z-50 w-full max-w-sm">
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        icon={alert.icon}
                        duration={alert.variant === "success" ? 3000 : 5000}
                        onClose={() => setAlert(null)}
                        className="shadow-lg"
                    >
                        {alert.message}
                    </Alert>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý hệ thống
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Quản lý cấu hình hệ thống VTICKET.
                </p>
            </div>

            <Tabs
                tabs={tabs}
                defaultTab="general"
                onChange={setActiveTab}
            />

            <div>
                {ActiveContent && <ActiveContent onAlert={setAlert} />}
            </div>
        </div>
    );
}

export default SystemPage;
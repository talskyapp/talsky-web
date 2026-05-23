import {
    Lock,
    ChevronRight,
    AlertTriangle,
    Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/AccountSettings.css";

export default function AccountSettings() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const actionRows = [
        {
            icon: <Lock size={18} />,
            title: t("account.actions.changePassword.title"),
            description: t("account.actions.changePassword.description"),
            action: t("account.actions.changePassword.action"),
            onClick: () => navigate("/dashboard/settings/change-password"),
            danger: false,
        },
        {
            icon: <AlertTriangle size={18} />,
            title: t("account.actions.deactivate.title"),
            description: t("account.actions.deactivate.description"),
            action: t("account.actions.deactivate.action"),
            onClick: () => navigate("/dashboard/settings/deactivate-account"),
            danger: false,
        },
        {
            icon: <Trash2 size={18} />,
            title: t("account.actions.delete.title"),
            description: t("account.actions.delete.description"),
            action: t("account.actions.delete.action"),
            onClick: () => navigate("/dashboard/settings/delete-account"),
            danger: true,
        },
    ];

    return (
        <div className="account-page">
            <div className="account-shell">
                <div className="account-header">
                    <div>
                        <p className="account-kicker">{t("account.kicker")}</p>
                        <h1>{t("account.title")}</h1>
                        <p className="account-subtitle">{t("account.subtitle")}</p>
                    </div>

                    <button
                        type="button"
                        className="account-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        {t("account.back")}
                    </button>
                </div>

                <section className="account-card">
                    <div className="account-card-head">
                        <h2>{t("account.sectionTitle")}</h2>
                        <p>{t("account.sectionSubtitle")}</p>
                    </div>

                    <div className="account-card-body">
                        {actionRows.map((item) => (
                            <button
                                key={item.title}
                                type="button"
                                className={`account-action-row ${item.danger ? "danger" : ""}`}
                                onClick={item.onClick}
                            >
                                <div className="account-row-left">
                                    <div className="account-row-icon">{item.icon}</div>

                                    <div className="account-row-copy">
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                </div>

                                <div className="account-action-right">
                                    <span>{item.action}</span>
                                    <ChevronRight size={18} />
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
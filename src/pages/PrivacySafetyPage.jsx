import { useState, useEffect } from "react";
import {
    Shield,
    Eye,
    Clock3,
    MapPin,
    Compass,
    MessageSquareMore,
    Filter,
    BellRing,
    Lock,
    ChevronRight,
    UserX,
    AlertTriangle,
    Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { apiClient } from "../lib/apiClient";
import "../styles/PrivacySafety.css";

export default function PrivacySafetyPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [settings, setSettings] = useState({
        privateProfile: false,
        showOnlineStatus: true,
        showLastSeen: true,
        showLocation: true,
        showInDiscovery: true,
        allowMessagesFromEveryone: true,
        filterMessageRequests: true,
        muteMessagePreviews: false,
        blockUnknownChatRequests: false,
        loginAlerts: true,
        securityAlerts: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const res = await apiClient.get("/api/users/privacy-settings");
                const data = res.data || {};

                setSettings((prev) => ({
                    ...prev,
                    ...data,
                }));
            } catch (err) {
                console.error("Privacy settings load error:", err);
                setError(t("privacy.errors.load"));
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [t]);

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 2500);

        return () => clearTimeout(timer);
    }, [success]);

    const toggleSetting = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await apiClient.patch("/api/users/privacy-settings", settings);

            setSuccess(t("privacy.saved"));
        } catch (err) {
            console.error("Privacy settings save error:", err);
            setError(t("privacy.errors.save"));
        } finally {
            setSaving(false);
        }
    };

    const visibilityRows = [
        {
            key: "privateProfile",
            icon: <Shield size={18} />,
            title: t("privacy.items.privateProfile.title"),
            description: t("privacy.items.privateProfile.description"),
        },
        {
            key: "showOnlineStatus",
            icon: <Eye size={18} />,
            title: t("privacy.items.showOnlineStatus.title"),
            description: t("privacy.items.showOnlineStatus.description"),
        },
        {
            key: "showLastSeen",
            icon: <Clock3 size={18} />,
            title: t("privacy.items.showLastSeen.title"),
            description: t("privacy.items.showLastSeen.description"),
        },
        {
            key: "showLocation",
            icon: <MapPin size={18} />,
            title: t("privacy.items.showLocation.title"),
            description: t("privacy.items.showLocation.description"),
        },
        {
            key: "showInDiscovery",
            icon: <Compass size={18} />,
            title: t("privacy.items.showInDiscovery.title"),
            description: t("privacy.items.showInDiscovery.description"),
        },
    ];

    const messagingRows = [
        {
            key: "allowMessagesFromEveryone",
            icon: <MessageSquareMore size={18} />,
            title: t("privacy.items.allowMessagesFromEveryone.title"),
            description: t("privacy.items.allowMessagesFromEveryone.description"),
        },
        {
            key: "filterMessageRequests",
            icon: <Filter size={18} />,
            title: t("privacy.items.filterMessageRequests.title"),
            description: t("privacy.items.filterMessageRequests.description"),
        },
        {
            key: "muteMessagePreviews",
            icon: <MessageSquareMore size={18} />,
            title: t("privacy.items.muteMessagePreviews.title"),
            description: t("privacy.items.muteMessagePreviews.description"),
        },
        {
            key: "blockUnknownChatRequests",
            icon: <Lock size={18} />,
            title: t("privacy.items.blockUnknownChatRequests.title"),
            description: t("privacy.items.blockUnknownChatRequests.description"),
        },
    ];

    const safetyRows = [
        {
            key: "loginAlerts",
            icon: <BellRing size={18} />,
            title: t("privacy.items.loginAlerts.title"),
            description: t("privacy.items.loginAlerts.description"),
        },
        {
            key: "securityAlerts",
            icon: <Shield size={18} />,
            title: t("privacy.items.securityAlerts.title"),
            description: t("privacy.items.securityAlerts.description"),
        },
    ];

    const actionRows = [
        {
            icon: <UserX size={18} />,
            title: t("privacy.actions.blockedUsers.title"),
            description: t("privacy.actions.blockedUsers.description"),
            action: t("privacy.actions.blockedUsers.action"),
            onClick: () => navigate("/dashboard/settings/blocked-users"),
            danger: false,
        },
        {
            icon: <Lock size={18} />,
            title: t("privacy.actions.changePassword.title"),
            description: t("privacy.actions.changePassword.description"),
            action: t("privacy.actions.changePassword.action"),
            onClick: () => navigate("/dashboard/settings/change-password"),
            danger: false,
        },
        {
            icon: <AlertTriangle size={18} />,
            title: t("privacy.actions.deactivate.title"),
            description: t("privacy.actions.deactivate.description"),
            action: t("privacy.actions.deactivate.action"),
            onClick: () => navigate("/dashboard/settings/deactivate-account"),
            danger: false,
        },
        {
            icon: <Trash2 size={18} />,
            title: t("privacy.actions.delete.title"),
            description: t("privacy.actions.delete.description"),
            action: t("privacy.actions.delete.action"),
            onClick: () => navigate("/dashboard/settings/delete-account"),
            danger: true,
        },
    ];

    const renderSwitchRows = (rows) =>
        rows.map((row) => (
            <div className="privacy-row" key={row.key}>
                <div className="privacy-row-left">
                    <div className="privacy-row-icon">{row.icon}</div>

                    <div className="privacy-row-copy">
                        <h3>{row.title}</h3>
                        <p>{row.description}</p>
                    </div>
                </div>

                <div className="privacy-row-right">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={settings[row.key]}
                            onChange={() => toggleSetting(row.key)}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
        ));

    if (loading) {
        return (
            <div className="privacy-page">
                <div className="privacy-shell">
                    <div className="notifications-settings-loading">
                        {t("privacy.loading")}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="privacy-page">
            <div className="privacy-shell">
                <div className="privacy-header">
                    <div>
                        <p className="privacy-kicker">{t("privacy.kicker")}</p>
                        <h1>{t("privacy.title")}</h1>
                        <p className="privacy-subtitle">{t("privacy.subtitle")}</p>
                    </div>

                    <div className="privacy-header-actions">
                        <button
                            type="button"
                            className="privacy-back-btn"
                            onClick={() => navigate(-1)}
                        >
                            {t("privacy.back")}
                        </button>

                        <button
                            type="button"
                            className="privacy-save-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? t("privacy.saving") : t("privacy.save")}
                        </button>
                    </div>
                </div>

                {error && <p className="notifications-settings-error">{error}</p>}
                {success && <p className="notifications-settings-success">{success}</p>}

                <div className="privacy-grid">
                    <section className="privacy-card">
                        <div className="privacy-card-head">
                            <h2>{t("privacy.sections.visibility.title")}</h2>
                            <p>{t("privacy.sections.visibility.description")}</p>
                        </div>

                        <div className="privacy-card-body">
                            {renderSwitchRows(visibilityRows)}
                        </div>
                    </section>

                    <section className="privacy-card">
                        <div className="privacy-card-head">
                            <h2>{t("privacy.sections.messaging.title")}</h2>
                            <p>{t("privacy.sections.messaging.description")}</p>
                        </div>

                        <div className="privacy-card-body">
                            {renderSwitchRows(messagingRows)}
                        </div>
                    </section>

                    <section className="privacy-card">
                        <div className="privacy-card-head">
                            <h2>{t("privacy.sections.safety.title")}</h2>
                            <p>{t("privacy.sections.safety.description")}</p>
                        </div>

                        <div className="privacy-card-body">
                            {renderSwitchRows(safetyRows)}
                        </div>
                    </section>

                    <section className="privacy-card">
                        <div className="privacy-card-head">
                            <h2>{t("privacy.sections.actions.title")}</h2>
                            <p>{t("privacy.sections.actions.description")}</p>
                        </div>

                        <div className="privacy-card-body actions-only">
                            {actionRows.map((item) => (
                                <button
                                    key={item.title}
                                    type="button"
                                    className={`privacy-action-row ${item.danger ? "danger" : ""}`}
                                    onClick={item.onClick}
                                >
                                    <div className="privacy-row-left">
                                        <div className="privacy-row-icon">{item.icon}</div>

                                        <div className="privacy-row-copy">
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                    </div>

                                    <div className="privacy-action-right">
                                        <span>{item.action}</span>
                                        <ChevronRight size={18} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
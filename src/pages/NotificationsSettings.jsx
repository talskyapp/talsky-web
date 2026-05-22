import { useEffect, useState } from "react";
import {
    Bell,
    MessageCircle,
    UserPlus,
    Sparkles,
    Megaphone,
    ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/NotificationsSettings.css";

export default function NotificationsSettings() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [settings, setSettings] = useState({
        messages: true,
        activity: true,
        follows: true,
        aiTutor: true,
        marketing: false,
        security: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const res = await apiClient.get("/api/users/notification-settings");
                const data = res.data || {};

                setSettings({
                    messages: data.messages ?? true,
                    activity: data.activity ?? true,
                    follows: data.follows ?? true,
                    aiTutor: data.aiTutor ?? true,
                    marketing: data.marketing ?? false,
                    security: data.security ?? true,
                });
            } catch (err) {
                console.error("Notification settings load error:", err);
                setError(t("notificationsSettings.errors.load"));
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

    const updateToggle = (section) => {
        setSettings((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await apiClient.patch("/api/users/notification-settings", settings);

            setSuccess(t("notificationsSettings.saved"));
        } catch (err) {
            console.error("Notification settings save error:", err);
            setError(t("notificationsSettings.errors.save"));
        } finally {
            setSaving(false);
        }
    };

    const rows = [
        {
            key: "messages",
            icon: <MessageCircle size={18} />,
            title: t("notificationsSettings.items.messages.title"),
            description: t("notificationsSettings.items.messages.description"),
        },
        {
            key: "activity",
            icon: <Bell size={18} />,
            title: t("notificationsSettings.items.activity.title"),
            description: t("notificationsSettings.items.activity.description"),
        },
        {
            key: "follows",
            icon: <UserPlus size={18} />,
            title: t("notificationsSettings.items.follows.title"),
            description: t("notificationsSettings.items.follows.description"),
        },
        {
            key: "aiTutor",
            icon: <Sparkles size={18} />,
            title: t("notificationsSettings.items.aiTutor.title"),
            description: t("notificationsSettings.items.aiTutor.description"),
        },
        {
            key: "marketing",
            icon: <Megaphone size={18} />,
            title: t("notificationsSettings.items.marketing.title"),
            description: t("notificationsSettings.items.marketing.description"),
        },
        {
            key: "security",
            icon: <ShieldCheck size={18} />,
            title: t("notificationsSettings.items.security.title"),
            description: t("notificationsSettings.items.security.description"),
        },
    ];

    if (loading) {
        return (
            <div className="notifications-settings-page">
                <div className="notifications-settings-shell">
                    <div className="notifications-settings-loading">
                        {t("notificationsSettings.loading")}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-settings-page">
            <div className="notifications-settings-shell">
                <div className="notifications-settings-header">
                    <div>
                        <p className="notifications-settings-kicker">
                            {t("notificationsSettings.kicker")}
                        </p>
                        <h1>{t("notificationsSettings.title")}</h1>
                        <p className="notifications-settings-subtitle">
                            {t("notificationsSettings.subtitle")}
                        </p>
                    </div>

                    <div className="notifications-settings-header-actions">
                        <button
                            type="button"
                            className="notifications-settings-back"
                            onClick={() => navigate(-1)}
                        >
                            {t("notificationsSettings.back")}
                        </button>

                        <button
                            type="button"
                            className="notifications-settings-save"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? t("notificationsSettings.saving")
                                : t("notificationsSettings.save")}
                        </button>
                    </div>
                </div>

                {error && <p className="notifications-settings-error">{error}</p>}
                {success && <p className="notifications-settings-success">{success}</p>}

                <div className="notifications-settings-card">
                    <div className="notifications-settings-table-head one-col">
                        <span>{t("notificationsSettings.table.type")}</span>
                        <span>{t("notificationsSettings.table.enabled")}</span>
                    </div>

                    <div className="notifications-settings-list">
                        {rows.map((row) => (
                            <div
                                className="notifications-settings-row one-col"
                                key={row.key}
                            >
                                <div className="notifications-settings-info">
                                    <div className="notifications-settings-icon">
                                        {row.icon}
                                    </div>

                                    <div>
                                        <h3>{row.title}</h3>
                                        <p>{row.description}</p>
                                    </div>
                                </div>

                                <div className="notifications-settings-switch-wrap">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={settings[row.key]}
                                            onChange={() => updateToggle(row.key)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="notifications-settings-note">
                    <strong>{t("notificationsSettings.noteTitle")}</strong>
                    <p>{t("notificationsSettings.noteText")}</p>
                </div>
            </div>
        </div>
    );
}
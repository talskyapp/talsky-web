import { useNavigate } from "react-router-dom";
import {
    User,
    Globe,
    Bell,
    Shield,
    CreditCard,
    CircleHelp,
    LogOut,
    Trash2,
    ChevronRight,
    Crown,
    Lock,
} from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/SettingsPage.css";

export default function SettingsPage({ user: userProp }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const user = userProp || storedUser;

    const resolvePhoto = (photo) => {
        if (!photo) return "/default-avatar.jpg";
        return photo.startsWith("http") ? photo : `${API_URL}${photo}`;
    };

    const accountProvider =
        user?.provider === "google"
            ? "Google"
            : user?.provider === "apple"
                ? "Apple"
                : "Email";

    const currentPlan =
        user?.subscription?.plan === "pro"
            ? t("settings.pro")
            : t("settings.free");

    const settingsSections = [
        {
            title: t("settings.sections.account"),
            items: [
                {
                    icon: <User size={18} />,
                    label: t("settings.accountDetails.label"),
                    description: t("settings.accountDetails.description"),
                    onClick: () => navigate("/dashboard/profile/edit"),
                },
                {
                    icon: <Lock size={18} />,
                    label: t("settings.loginMethod.label"),
                    description: t("settings.loginMethod.description", {
                        provider: accountProvider,
                    }),
                    disabled: true,
                },
            ],
        },
        {
            title: t("settings.sections.preferences"),
            items: [
                {
                    icon: <Globe size={18} />,
                    label: t("settings.appLanguage.label"),
                    description: t("settings.appLanguage.description"),
                    onClick: () => navigate("/dashboard/settings/language"),
                },
                {
                    icon: <Bell size={18} />,
                    label: t("settings.notifications.label"),
                    description: t("settings.notifications.description"),
                    onClick: () => navigate("/dashboard/settings/notifications"),
                },
            ],
        },
        {
            title: t("settings.sections.privacy"),
            items: [
                {
                    icon: <Shield size={18} />,
                    label: t("settings.privacySafety.label"),
                    description: t("settings.privacySafety.description"),
                    onClick: () => navigate("/dashboard/settings/privacy"),
                },
            ],
        },
        {
            title: t("settings.sections.subscription"),
            items: [
                {
                    icon: user?.subscription?.plan === "pro"
                        ? <Crown size={18} />
                        : <CreditCard size={18} />,
                    label: t("settings.subscriptionItem.label"),
                    description: t("settings.subscriptionItem.description", {
                        plan: currentPlan,
                    }),
                    onClick: () => navigate("/dashboard/pricing"),
                    badge: currentPlan,
                },
            ],
        },
        {
            title: t("settings.sections.support"),
            items: [
                {
                    icon: <CircleHelp size={18} />,
                    label: t("settings.helpSupport.label"),
                    description: t("settings.helpSupport.description"),
                    onClick: () => navigate("/dashboard/settings/help"),
                },
            ],
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }

        navigate("/login");
    };

    const handleDeleteAccount = () => {
        navigate("/dashboard/settings/delete-account");
    };

    return (
        <div className="settings-page">
            <div className="settings-header-card">
                <div className="settings-header-left">
                    <span className="settings-kicker">{t("settings.kicker")}</span>
                    <h1>{t("settings.title")}</h1>
                    <p>{t("settings.subtitle")}</p>
                </div>

                <div className="settings-profile-summary">
                    <img
                        src={resolvePhoto(user?.photo)}
                        alt="Profile"
                        className="settings-profile-avatar"
                        onError={(e) => {
                            e.currentTarget.src = "/default-avatar.jpg";
                        }}
                    />
                    <div>
                        <strong>{user?.name || "Your profile"}</strong>
                        <span>@{user?.username || "username"}</span>
                    </div>
                </div>
            </div>

            <div className="settings-sections">
                {settingsSections.map((section) => (
                    <section key={section.title} className="settings-section-card">
                        <div className="settings-section-top">
                            <h2>{section.title}</h2>
                        </div>

                        <div className="settings-list">
                            {section.items.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    className={`settings-item ${item.disabled ? "disabled" : ""}`}
                                    onClick={!item.disabled ? item.onClick : undefined}
                                >
                                    <div className="settings-item-icon">
                                        {item.icon}
                                    </div>

                                    <div className="settings-item-content">
                                        <div className="settings-item-title-row">
                                            <span className="settings-item-label">
                                                {item.label}
                                            </span>

                                            {item.badge && (
                                                <span
                                                    className={`settings-badge ${item.badge.toLowerCase()}`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>

                                        <span className="settings-item-description">
                                            {item.description}
                                        </span>
                                    </div>

                                    {!item.disabled && (
                                        <ChevronRight size={18} className="settings-item-arrow" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <section className="settings-session-zone">
                <div className="settings-session-header">
                    <h2>{t("settings.sections.session")}</h2>
                    <p>{t("settings.sessionSubtitle")}</p>
                </div>

                <div className="settings-session-actions">
                    <button
                        type="button"
                        className="settings-session-btn logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        {t("settings.logout")}
                    </button>
                </div>
            </section>
        </div>
    );
}
import { X, MapPin, Sparkles } from "lucide-react";
import { API_URL } from "../lib/config";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

export default function IdealMatchFloatingCard({ match, onClose }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!match?.user) return null;

    const user = match.user;

    const photo = user.photo
        ? user.photo.startsWith("http")
            ? user.photo
            : `${API_URL}${user.photo}`
        : "/default-avatar.png";

    const handleViewProfile = () => {
        navigate(`/dashboard/profile/${user._id}`);
    };

    const handleStartChat = () => {
        navigate(`/dashboard/profile/${user._id}`, {
            state: { startChat: true },
        });
    };

    return (
        <div className="ideal-match-floating-overlay">
            <div className="ideal-match-floating-card">
                <button
                    type="button"
                    className="ideal-match-close"
                    onClick={onClose}
                    aria-label={t("idealPartner.close")}
                    title={t("idealPartner.close")}
                >
                    <X size={18} />
                </button>

                <div className="ideal-match-badge">
                    <Sparkles size={14} />
                    <span>{t("idealPartner.badge")}</span>
                </div>

                <div className="ideal-match-main">
                    <div className="ideal-match-avatar-wrap">
                        <img
                            src={photo}
                            alt={user.name || user.username || "User"}
                            className="ideal-match-avatar"
                        />
                    </div>

                    <div className="ideal-match-content">
                        <h3>{t("idealPartner.title")}</h3>

                        <div className="ideal-match-name">
                            {user.name || user.username}
                        </div>

                        <div className="ideal-match-subtitle">
                            <span>{user.nativeLanguage || "—"}</span>
                            <span className="ideal-match-dot">•</span>
                            <span>
                                {Array.isArray(user.languageToLearn)
                                    ? user.languageToLearn.join(", ")
                                    : user.languageToLearn || "—"}
                            </span>
                        </div>

                        {!!user.location?.city && (
                            <div className="ideal-match-location">
                                <MapPin size={14} />
                                <span>
                                    {user.location.city}
                                    {user.location.country ? `, ${user.location.country}` : ""}
                                </span>
                            </div>
                        )}

                        <div className="ideal-match-reasons">
                            {(match.reasons || []).slice(0, 3).map((reason) => (
                                <span key={reason} className="ideal-match-chip">
                                    {t(reason)}
                                </span>
                            ))}
                        </div>

                        <div className="ideal-match-actions">
                            <button
                                type="button"
                                className="ideal-match-btn secondary"
                                onClick={handleViewProfile}
                            >
                                {t("idealPartner.viewProfile")}
                            </button>

                            <button
                                type="button"
                                className="ideal-match-btn primary"
                                onClick={handleStartChat}
                            >
                                {t("idealPartner.startChat")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldBan, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { getImageUrl } from "../utils/getImageUrl";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/BlockedUsers.css";

export default function BlockedUsersPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState("");
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchBlockedUsers = async () => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const res = await apiClient.get("/api/blocks/blocked-users");
                setBlockedUsers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Blocked users load error:", err);
                setError(t("blockedUsers.errors.load"));
            } finally {
                setLoading(false);
            }
        };

        fetchBlockedUsers();
    }, [t]);

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 2500);

        return () => clearTimeout(timer);
    }, [success]);

    const handleUnblock = async (userId) => {
        try {
            setSavingId(userId);
            setError("");
            setSuccess("");
            
            await apiClient.delete(`/api/blocks/${userId}`);

            setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
            setSuccess(t("blockedUsers.unblocked"));
        } catch (err) {
            console.error("Unblock error:", err);
            setError(t("blockedUsers.errors.unblock"));
        } finally {
            setSavingId("");
        }
    };

    if (loading) {
        return (
            <div className="blocked-page">
                <div className="blocked-shell">
                    <div className="blocked-loading">
                        {t("blockedUsers.loading")}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="blocked-page">
            <div className="blocked-shell">
                <div className="blocked-header">
                    <div>
                        <p className="blocked-kicker">{t("blockedUsers.kicker")}</p>
                        <h1>{t("blockedUsers.title")}</h1>
                        <p className="blocked-subtitle">{t("blockedUsers.subtitle")}</p>
                    </div>

                    <button
                        type="button"
                        className="blocked-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} />
                        <span>{t("blockedUsers.back")}</span>
                    </button>
                </div>

                {error && <p className="blocked-error">{error}</p>}
                {success && <p className="blocked-success">{success}</p>}

                {blockedUsers.length === 0 ? (
                    <div className="blocked-empty">
                        <div className="blocked-empty-icon">
                            <ShieldBan size={22} />
                        </div>
                        <h3>{t("blockedUsers.emptyTitle")}</h3>
                        <p>{t("blockedUsers.emptyText")}</p>
                    </div>
                ) : (
                    <div className="blocked-card">
                        {blockedUsers.map((user) => (
                            <div className="blocked-row" key={user._id}>
                                <div className="blocked-user">
                                    <img
                                        src={getImageUrl(user.photo)}
                                        alt={user.name || "User"}
                                        className="blocked-avatar"
                                    />

                                    <div className="blocked-user-copy">
                                        <h3>{user.name || t("blockedUsers.unknownName")}</h3>
                                        <p>
                                            {user.username
                                                ? `@${user.username}`
                                                : t("blockedUsers.noUsername")}
                                        </p>

                                        {user.bio?.trim() && <span>{user.bio}</span>}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="blocked-unblock-btn"
                                    onClick={() => handleUnblock(user._id)}
                                    disabled={savingId === user._id}
                                >
                                    <UserX size={16} />
                                    <span>
                                        {savingId === user._id
                                            ? t("blockedUsers.unblocking")
                                            : t("blockedUsers.unblock")}
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
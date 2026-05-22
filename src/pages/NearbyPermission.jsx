import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/NearbyPermission.css";

export default function NearbyPermission() {
    const navigate = useNavigate();
    const { setUser } = useOutletContext();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAccept = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/users/location-permission`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ locationPermission: true }),
            });

            const updatedUser = await res.json();

            if (!res.ok) {
                setError(updatedUser?.msg || t("nearbyPermission.enableError"));
                setLoading(false);
                return;
            }

            setUser(updatedUser);
            navigate("/dashboard/update-location");
        } catch (err) {
            console.error(err);
            setError(t("nearbyPermission.genericError"));
            setLoading(false);
        }
    };

    const handleDecline = () => {
        navigate("/dashboard/feed");
    };

    return (
        <div className="nearby-permission-page">
            <div className="nearby-permission-bg nearby-permission-bg-1" />
            <div className="nearby-permission-bg nearby-permission-bg-2" />

            <div className="nearby-permission-card">
                <div className="nearby-permission-visual">
                    <div className="nearby-permission-badge">
                        {t("nearbyPermission.badge")}
                    </div>

                    <div className="nearby-permission-image-wrap">
                        <img
                            src="/images/nearby-hero.png"
                            alt="Nearby"
                            className="nearby-permission-image"
                        />
                    </div>

                    <div className="nearby-permission-pill-group">
                        <div className="nearby-permission-pill">
                            <span className="pill-dot" />
                            {t("nearbyPermission.pill1")}
                        </div>

                        <div className="nearby-permission-pill">
                            <span className="pill-dot" />
                            {t("nearbyPermission.pill2")}
                        </div>
                    </div>
                </div>

                <div className="nearby-permission-content">
                    <p className="nearby-permission-kicker">
                        {t("nearbyPermission.kicker")}
                    </p>

                    <h1 className="nearby-permission-title">
                        {t("nearbyPermission.title")}
                    </h1>

                    <p className="nearby-permission-description">
                        {t("nearbyPermission.description")}
                    </p>

                    <div className="nearby-permission-note">
                        <span className="note-icon">🔒</span>
                        <p>{t("nearbyPermission.privacyNote")}</p>
                    </div>

                    <div className="nearby-permission-benefits">
                        <div className="benefit-row">
                            <span className="benefit-check">✓</span>
                            <span>{t("nearbyPermission.benefit1")}</span>
                        </div>

                        <div className="benefit-row">
                            <span className="benefit-check">✓</span>
                            <span>{t("nearbyPermission.benefit2")}</span>
                        </div>

                        <div className="benefit-row">
                            <span className="benefit-check">✓</span>
                            <span>{t("nearbyPermission.benefit3")}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="nearby-permission-error">
                            {error}
                        </div>
                    )}

                    <div className="nearby-permission-actions">
                        <button
                            className="nearby-permission-btn-primary"
                            onClick={handleAccept}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-loading-wrap">
                                    <span className="btn-spinner" />
                                    {t("nearbyPermission.enabling")}
                                </span>
                            ) : (
                                t("nearbyPermission.enable")
                            )}
                        </button>

                        <button
                            className="nearby-permission-btn-secondary"
                            onClick={handleDecline}
                            disabled={loading}
                        >
                            {t("nearbyPermission.notNow")}
                        </button>
                    </div>

                    <p className="nearby-permission-footer">
                        {t("nearbyPermission.footer")}
                    </p>
                </div>
            </div>
        </div>
    );
}
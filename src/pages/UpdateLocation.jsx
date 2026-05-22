import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/UpdateLocation.css";

export default function UpdateLocation() {
    const navigate = useNavigate();
    const { setUser } = useOutletContext();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUseLocation = () => {
        setLoading(true);
        setError("");

        if (!navigator.geolocation) {
            setError(t("updateLocation.browserUnsupported"));
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    const token = localStorage.getItem("token");
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                    let city = "";
                    let country = "";

                    const geoRes = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                    );

                    const geoData = await geoRes.json();
                    const address = geoData.results?.[0]?.address_components || [];

                    city =
                        address.find((a) => a.types.includes("locality"))?.long_name ||
                        address.find((a) => a.types.includes("sublocality"))?.long_name ||
                        address.find((a) => a.types.includes("administrative_area_level_2"))?.long_name ||
                        address.find((a) => a.types.includes("administrative_area_level_1"))?.long_name ||
                        "";

                    country =
                        address.find((a) => a.types.includes("country"))?.long_name ||
                        "";

                    const res = await fetch(`${API_URL}/api/users/update-location`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            lat: latitude,
                            lng: longitude,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            city,
                            country,
                        }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        setError(data.msg || t("updateLocation.updateError"));
                        setLoading(false);
                        return;
                    }

                    setUser(data.user);
                    navigate("/dashboard/nearby-map");
                } catch (err) {
                    console.error(err);
                    setError(t("updateLocation.genericError"));
                }

                setLoading(false);
            },
            (err) => {
                setLoading(false);

                if (err.code === 1) {
                    setError(t("updateLocation.permissionBlocked"));
                } else if (err.code === 2) {
                    setError(t("updateLocation.unavailable"));
                } else if (err.code === 3) {
                    setError(t("updateLocation.timeout"));
                } else {
                    setError(t("updateLocation.unknownError"));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="update-location-page">
            <div className="update-location-card">
                <div className="update-location-badge">
                    {t("updateLocation.badge")}
                </div>

                <div className="update-location-icon-wrap">
                    {loading ? (
                        <div className="location-loader" aria-hidden="true" />
                    ) : (
                        <div className="location-icon" aria-hidden="true">
                            📍
                        </div>
                    )}
                </div>

                <h1>{t("updateLocation.title")}</h1>

                <p className="update-location-subtext">
                    {t("updateLocation.subtitle")}
                </p>

                <div className="privacy-note">
                    <span className="privacy-note-icon">🔒</span>
                    <p>{t("updateLocation.privacyNote")}</p>
                </div>

                {error && <div className="update-location-error">{error}</div>}

                <div className="update-location-actions">
                    <button
                        className="btn-primary"
                        onClick={handleUseLocation}
                        disabled={loading}
                    >
                        {loading
                            ? t("updateLocation.loadingButton")
                            : t("updateLocation.useLocation")}
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => navigate("/dashboard/feed")}
                        disabled={loading}
                    >
                        {t("updateLocation.notNow")}
                    </button>
                </div>

                <p className="update-location-footer">
                    {t("updateLocation.footer")}
                </p>
            </div>
        </div>
    );
}
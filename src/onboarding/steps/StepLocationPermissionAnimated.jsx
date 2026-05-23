import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../lib/config";
import "../../styles/LocationPermissionAnimated.css";

export default function StepLocationPermissionAnimated({ onContinue }) {
    const [loading, setLoading] = useState(false);
    const [denied, setDenied] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setDenied(true);
            setErrorMessage("Your browser does not support location access.");
            return;
        }

        setLoading(true);
        setDenied(false);
        setErrorMessage("");

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                    const geoResponse = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
                    );

                    const geoData = await geoResponse.json();

                    const results = geoData.results || [];
                    const address = results[0]?.address_components || [];

                    const city =
                        address.find((a) => a.types.includes("locality"))?.long_name ||
                        address.find((a) =>
                            a.types.includes("administrative_area_level_2")
                        )?.long_name ||
                        address.find((a) =>
                            a.types.includes("administrative_area_level_1")
                        )?.long_name ||
                        "Unknown";

                    const country =
                        address.find((a) => a.types.includes("country"))?.long_name ||
                        "Unknown";

                    const timezoneResponse = await fetch(
                        `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Math.floor(
                            Date.now() / 1000
                        )}&key=${apiKey}`
                    );

                    const timezoneData = await timezoneResponse.json();

                    const timezone = timezoneData.timeZoneId || "UTC";

                    await axios.put(
                        `${API_URL}/api/users/update-location`,
                        { city, country, timezone, lat, lng },
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );

                    onContinue();
                } catch (err) {
                    console.error("Location update error:", err);
                    setDenied(true);
                    setErrorMessage(
                        "We couldn’t save your location right now. You can continue and set it up later."
                    );
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);

                setDenied(true);

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setErrorMessage(
                            "Location access was denied. You can continue, but nearby features may be limited."
                        );
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setErrorMessage(
                            "Your location could not be determined right now."
                        );
                        break;
                    case error.TIMEOUT:
                        setErrorMessage(
                            "The location request took too long. Please try again."
                        );
                        break;
                    default:
                        setErrorMessage(
                            "Something went wrong while requesting your location."
                        );
                        break;
                }

                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    };

    return (
        <div className="loc-wrapper fade-in">
            <div className="loc-card slide-up">
                <div className="loc-illustration" aria-hidden="true">
                    <svg width="160" height="160" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="90" fill="#6D4CFF" opacity="0.12" />
                        <circle cx="100" cy="100" r="68" fill="#6D4CFF" opacity="0.08" />
                        <path
                            d="M100 42C81 42 66 57 66 76c0 23 34 67 34 67s34-44 34-67c0-19-15-34-34-34Z"
                            fill="#6D4CFF"
                        />
                        <circle cx="100" cy="77" r="15" fill="white" />
                        <circle cx="100" cy="77" r="7" fill="#6D4CFF" />
                    </svg>
                </div>

                <span className="loc-badge">Optional step</span>

                <h2 className="loc-title">Enable location access</h2>

                <p className="loc-subtitle">
                    Allow location to discover people nearby, improve recommendations,
                    and personalize your TalSky experience.
                </p>

                {!denied ? (
                    <div className="loc-actions">
                        <button
                            className="loc-allow-btn"
                            onClick={requestLocation}
                            disabled={loading}
                            type="button"
                        >
                            {loading ? "Requesting location..." : "Allow location access"}
                        </button>

                        <button
                            className="loc-skip-btn"
                            onClick={onContinue}
                            disabled={loading}
                            type="button"
                        >
                            Skip for now
                        </button>
                    </div>
                ) : (
                    <div className="loc-actions">
                        <p className="loc-error">{errorMessage}</p>

                        <button
                            className="loc-retry-btn"
                            onClick={requestLocation}
                            type="button"
                        >
                            Try again
                        </button>

                        <button
                            className="loc-skip-btn"
                            onClick={onContinue}
                            type="button"
                        >
                            Continue without location
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
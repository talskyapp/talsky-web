import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../lib/config";
import "../../styles/LocationPermission.css";

export default function StepLocationPermission({ onContinue }) {
    const [loading, setLoading] = useState(false);
    const [denied, setDenied] = useState(false);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setDenied(true);
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    await axios.put(
                        `${API_URL}/api/users/update-location`,
                        {
                            lat: latitude,
                            lng: longitude,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );

                    onContinue(); // pasa al siguiente paso del onboarding
                } catch (err) {
                    console.log("Location update error:", err);
                    setDenied(true);
                }

                setLoading(false);
            },
            () => {
                setDenied(true);
                setLoading(false);
            }
        );
    };

    return (
        <div className="location-container">
            <h2>Enable Location</h2>
            <p className="subtitle">
                TalSky uses your location to show you people near you and improve your experience.
            </p>

            <div className="illustration">📍</div>

            {!denied ? (
                <>
                    <button className="allow-btn" onClick={requestLocation} disabled={loading}>
                        {loading ? "Requesting..." : "Allow Location Access"}
                    </button>

                    <button className="skip-btn" onClick={onContinue}>
                        Skip for now
                    </button>
                </>
            ) : (
                <>
                    <p className="error-text">
                        You denied location access. You can still continue, but some features may be limited.
                    </p>

                    <button className="skip-btn" onClick={onContinue}>
                        Continue without location
                    </button>
                </>
            )}
        </div>
    );
}
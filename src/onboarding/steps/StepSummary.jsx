import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../lib/config";
import { OnboardingContext } from "../OnboardingContext";
import OnboardingLayout from "../OnboardingLayout";
import "../../styles/OnboardingSummary.css";

const summaryItems = [
    {
        key: "languageToLearn",
        label: "Language to learn",
        icon: "🎯",
    },
    {
        key: "nativeLanguage",
        label: "Native language",
        icon: "🗣️",
    },
    {
        key: "goal",
        label: "Main goal",
        icon: "✨",
    },
    {
        key: "level",
        label: "Current level",
        icon: "📘",
    },
];

const StepSummary = () => {
    const { data } = useContext(OnboardingContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFinish = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/users/onboarding`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    languageToLearn: data.languageToLearn,
                    nativeLanguage: data.nativeLanguage,
                    goal: data.goal,
                    level: data.level,
                }),
            });

            const responseData = await res.json().catch(() => ({}));

            if (!res.ok) {
                console.error(responseData);
                setError(responseData?.msg || "We couldn’t save your onboarding right now.");
                return;
            }

            localStorage.setItem("user", JSON.stringify(responseData.user));
            navigate("/dashboard/create-profile");
        } catch (err) {
            console.error("Error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingLayout>
            <div className="onb-summary-container">
                <div className="onb-summary-header">
                    <span className="onb-summary-badge">Final step</span>

                    <h1 className="onb-summary-title">Your learning profile</h1>

                    <p className="onb-summary-subtitle">
                        Review your preferences before we personalize your TalSky experience.
                    </p>
                </div>

                <div className="onb-summary-list">
                    {summaryItems.map((item) => (
                        <div key={item.key} className="onb-summary-card">
                            <div className="onb-summary-icon">{item.icon}</div>

                            <div className="onb-summary-text">
                                <span className="onb-summary-label">{item.label}</span>
                                <span className="onb-summary-value">
                                    {data[item.key] || "Not selected"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {error && <div className="onb-summary-error">{error}</div>}

                <button
                    className="onb-summary-btn"
                    onClick={handleFinish}
                    disabled={loading}
                    type="button"
                >
                    {loading ? "Saving your profile..." : "Finish setup"}
                </button>
            </div>
        </OnboardingLayout>
    );
};

export default StepSummary;
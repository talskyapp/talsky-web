import { CheckCircle2, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PricingSuccess.css";

export default function PricingSuccess() {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const appear = setTimeout(() => {
            setShowContent(true);
        }, 150);

        const redirect = setTimeout(() => {
            navigate("/dashboard/home");
        }, 3200);

        return () => {
            clearTimeout(appear);
            clearTimeout(redirect);
        };
    }, [navigate]);

    return (
        <div className="pricing-success-page">
            <div className={`pricing-success-card ${showContent ? "show" : ""}`}>
                <div className="pricing-success-icon">
                    <div className="pricing-success-ring" />

                    <div className="pricing-success-inner">
                        <CheckCircle2 size={42} />
                    </div>
                </div>

                <div className="pricing-success-pro">
                    <Crown size={16} />
                    <span>TalSky Pro Activated</span>
                </div>

                <h1>Welcome to TalSky Pro 🎉</h1>

                <p>
                    Your subscription is now active. Enjoy unlimited chats,
                    nearby discovery, advanced filters and priority visibility.
                </p>

                <div className="pricing-success-loading">
                    <div className="pricing-success-bar" />
                </div>

                <span className="pricing-success-small">
                    Redirecting to your dashboard...
                </span>
            </div>
        </div>
    );
}
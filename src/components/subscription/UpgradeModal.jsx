// src/components/subscription/UpgradeModal.jsx
import "../../styles/upgradeModal.css";

export default function UpgradeModal({
    open,
    onClose,
    onUpgrade,
    title = "Upgrade to Pro",
    message = "Unlock premium features with Pro.",
    featureList = [],
}) {
    if (!open) return null;

    return (
        <div className="upgrade-modal-overlay" onClick={onClose}>
            <div
                className="upgrade-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="upgrade-close-btn" onClick={onClose}>
                    ×
                </button>

                <div className="upgrade-badge">PRO</div>

                <h2>{title}</h2>
                <p>{message}</p>

                <div className="upgrade-plan-box">
                    <div className="upgrade-plan free">
                        <h3>Free</h3>
                        <p>5 new chats per day</p>
                        <p>1 basic course</p>
                        <p>No nearby</p>
                        <p>No filters</p>
                        <p>No multimedia</p>
                    </div>

                    <div className="upgrade-plan pro">
                        <h3>Pro - $14.99/month</h3>
                        <p>Unlimited chats</p>
                        {/* <p>All courses unlocked</p> */}
                        <p>Nearby</p>
                        <p>Search filters</p>
                        <p>Boost</p>
                        <p>Multimedia messages</p>
                    </div>
                </div>

                {featureList.length > 0 && (
                    <div className="upgrade-feature-list">
                        <h4>Unlocked with Pro</h4>
                        <ul>
                            {featureList.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <button className="upgrade-main-btn" onClick={onUpgrade}>
                    Upgrade now
                </button>
            </div>
        </div>
    );
}
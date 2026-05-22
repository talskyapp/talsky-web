import { useEffect, useMemo, useState } from "react";
import "../styles/ProfileQRModal.css";

export default function ProfileQRModal({ user, onClose }) {
    const [phase, setPhase] = useState("enter");
    const [copied, setCopied] = useState(false);

    const profileHandle = useMemo(() => {
        if (user?.username) return `@${user.username}`;
        if (user?.handle) return `@${user.handle}`;
        if (user?.name) return `@${String(user.name).toLowerCase().replace(/\s+/g, "")}`;
        return "@profile";
    }, [user]);

    const profileName = user?.name || user?.username || "TalSky User";

    const profileUrl = useMemo(() => {
        const handle = user?.username || user?.handle || "profile";
        return `https://talsky.app/u/${handle}`;
    }, [user]);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("flip"), 80);
        const t2 = setTimeout(() => setPhase("qr"), 950);

        const onEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onEsc);
        document.body.style.overflow = "hidden";

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            document.removeEventListener("keydown", onEsc);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profileName} on TalSky`,
                    text: `Connect with ${profileHandle} on TalSky`,
                    url: profileUrl,
                });
                return;
            }

            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (error) {
            console.error("Share failed:", error);
        }
    };

    return (
        <div className="qr-modal-overlay" onClick={onClose}>
            <div
                className="qr-modal-card"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="qr-modal-close"
                    type="button"
                    onClick={onClose}
                    aria-label="Close QR modal"
                >
                    ✕
                </button>

                <div className="qr-modal-user">
                    <img
                        src={user?.photo || "/default-avatar.jpg"}
                        alt="Profile"
                        className="qr-modal-avatar"
                    />

                    <div className="qr-modal-user-meta">
                        <h2>{profileName}</h2>
                        <p>{profileHandle}</p>
                    </div>
                </div>

                <div className="qr-modal-stage">
                    <div className={`qr-coin-wrap phase-${phase}`}>
                        <div className="qr-coin-face qr-coin-front">
                            <div className="qr-coin-inner">
                                <span className="qr-coin-symbol">TS</span>
                            </div>
                        </div>

                        <div className="qr-coin-face qr-coin-back">
                            <div className="qr-code-shell">
                                <div className="fake-qr-grid">
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="qr-modal-caption">
                    Scan to view profile and connect on TalSky
                </p>

                <div className="qr-modal-link">
                    <span>{profileUrl}</span>
                </div>

                <div className="qr-modal-actions">
                    <button
                        className="qr-modal-btn secondary"
                        type="button"
                        onClick={handleCopy}
                    >
                        {copied ? "Copied" : "Copy link"}
                    </button>

                    <button
                        className="qr-modal-btn primary"
                        type="button"
                        onClick={handleShare}
                    >
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setTimeout(() => {
            setCooldown((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearTimeout(timer);
    }, [cooldown]);

    async function handleSend(e) {
        e.preventDefault();

        if (!email.trim() || loading || cooldown > 0) return;

        try {
            setLoading(true);
            setError("");
            setSuccess(false);

            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.msg || t("forgotPassword.sendError"));
                return;
            }

            setCooldown(60);
            setSuccess(true);
        } catch {
            setError(t("forgotPassword.sendError"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-glow forgot-password-glow-one" />
            <div className="forgot-password-glow forgot-password-glow-two" />

            <form className="forgot-password-card" onSubmit={handleSend}>
                <div className="forgot-password-icon">
                    <Mail size={32} />
                </div>

                <p className="forgot-password-kicker">
                    TALSKY SECURITY
                </p>

                <h1 className="forgot-password-title">
                    {t("forgotPassword.title")}
                </h1>

                <p className="forgot-password-subtitle">
                    {t("forgotPassword.subtitle")}
                </p>

                <label className="forgot-password-label">
                    {t("login.email")}

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                            setSuccess(false);
                        }}
                        placeholder={t("forgotPassword.emailPlaceholder")}
                        className="forgot-password-input"
                        autoComplete="email"
                    />
                </label>

                {success ? (
                    <div className="forgot-password-success">
                        <strong>{t("forgotPassword.checkTitle")}</strong>
                        <p>{t("forgotPassword.checkText")}</p>
                    </div>
                ) : null}

                {error ? (
                    <div className="forgot-password-error">
                        {error}
                    </div>
                ) : null}

                <button
                    type="submit"
                    className="forgot-password-primary"
                    disabled={!email.trim() || loading || cooldown > 0}
                >
                    {loading
                        ? t("forgotPassword.loading")
                        : cooldown > 0
                            ? t("forgotPassword.sendAgainIn", { count: cooldown })
                            : t("forgotPassword.sendButton")}
                </button>

                <button
                    type="button"
                    className="forgot-password-back"
                    onClick={() => navigate("/login")}
                >
                    {t("forgotPassword.back")}
                </button>
            </form>
        </div>
    );
}
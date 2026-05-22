import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { MailCheck } from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/Login.css";

export default function VerifyEmail() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const email = searchParams.get("email") || "";

    const [cooldown, setCooldown] = useState(30);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const inputRef = useRef(null);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setTimeout(() => {
            setCooldown((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearTimeout(timer);
    }, [cooldown]);

    const finishLogin = (data) => {
        if (!data?.token || !data?.user) {
            setError(t("verifyEmail.verifyError"));
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;

        if (data.user?.isAdmin) {
            navigate("/admin/dashboard");
            return;
        }

        if (!data.user.onboardingCompleted) {
            navigate("/onboarding");
        } else if (!data.user.profileCompleted) {
            navigate("/dashboard/create-profile");
        } else {
            navigate("/dashboard/feed");
        }
    };

    const handleVerify = async (e) => {
        e?.preventDefault();
        setError("");
        setNotice("");

        if (!email) {
            setError(t("verifyEmail.missingEmail"));
            return;
        }

        if (code.length !== 6 || loading) return;

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/api/auth/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.msg || t("verifyEmail.invalidCode"));
                return;
            }

            finishLogin(data);
        } catch (err) {
            console.error("VERIFY EMAIL ERROR:", err);
            setError(t("verifyEmail.verifyError"));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setNotice("");

        if (!email || resending || cooldown > 0) return;

        try {
            setResending(true);

            const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.msg || t("verifyEmail.resendError"));
                return;
            }

            setCooldown(30);
            setNotice(t("verifyEmail.checkInbox"));
        } catch (err) {
            console.error("RESEND EMAIL ERROR:", err);
            setError(t("verifyEmail.resendError"));
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="login-page">
            <div className="verify-email-card">
                <div className="verify-email-icon">
                    <MailCheck size={34} strokeWidth={2.7} />
                </div>

                <h1>{t("verifyEmail.title")}</h1>

                <p className="verify-email-subtitle">
                    {t("verifyEmail.subtitle")}
                    <br />
                    <strong>{email || t("verifyEmail.emailFallback")}</strong>
                </p>

                <form onSubmit={handleVerify} className="verify-email-form">
                    <input
                        ref={inputRef}
                        className="verify-email-code"
                        value={code}
                        onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setCode(clean);
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        autoFocus
                    />

                    {error ? <div className="login-error">{error}</div> : null}
                    {notice ? <div className="login-success-note">{notice}</div> : null}

                    <button
                        type="submit"
                        className={`login-submit-btn ${loading ? "loading" : ""}`}
                        disabled={code.length !== 6 || loading}
                    >
                        {loading ? t("verifyEmail.verifying") : t("verifyEmail.verifyButton")}
                    </button>
                </form>

                <button
                    type="button"
                    className="verify-email-resend"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                >
                    {resending
                        ? t("verifyEmail.resending")
                        : cooldown > 0
                            ? t("verifyEmail.resendIn", { count: cooldown })
                            : t("verifyEmail.resend")}
                </button>

                <Link to="/login" className="verify-email-back">
                    {t("verifyEmail.back")}
                </Link>
            </div>
        </div>
    );
}
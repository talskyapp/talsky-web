import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { API_URL } from "../lib/config";
import "../styles/ResetPasswordPage.css";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { t } = useTranslation();

    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const valid = useMemo(() => {
        return (
            password.length >= 6 &&
            confirmPassword.length >= 6 &&
            password === confirmPassword &&
            token &&
            email
        );
    }, [password, confirmPassword, token, email]);

    async function handleReset(e) {
        e.preventDefault();

        if (!valid || loading) return;

        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    token,
                    password,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.msg || t("resetPassword.error"));
                return;
            }

            setSuccess(true);
        } catch {
            setError(t("resetPassword.error"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-glow reset-password-glow-one" />
            <div className="reset-password-glow reset-password-glow-two" />

            <form
                className="reset-password-card"
                onSubmit={handleReset}
            >
                <div className="reset-password-icon">
                    <LockKeyhole size={32} />
                </div>

                <p className="reset-password-kicker">
                    TALSKY SECURITY
                </p>

                <h1 className="reset-password-title">
                    {t("resetPassword.title")}
                </h1>

                <p className="reset-password-subtitle">
                    {t("resetPassword.subtitle")}
                </p>

                {!token || !email ? (
                    <div className="reset-password-error">
                        {t("resetPassword.invalidLink")}
                    </div>
                ) : null}

                {success ? (
                    <div className="reset-password-success">
                        <strong>
                            {t("resetPassword.successTitle")}
                        </strong>

                        <p>
                            {t("resetPassword.successText")}
                        </p>

                        <button
                            type="button"
                            className="reset-password-primary"
                            onClick={() => navigate("/login")}
                        >
                            {t("resetPassword.back")}
                        </button>
                    </div>
                ) : (
                    <>
                        <label className="reset-password-label">
                            {t("resetPassword.password")}

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder={t(
                                    "resetPassword.passwordPlaceholder"
                                )}
                                className="reset-password-input"
                            />
                        </label>

                        <label className="reset-password-label">
                            {t("resetPassword.confirmPassword")}

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder={t(
                                    "resetPassword.confirmPlaceholder"
                                )}
                                className="reset-password-input"
                            />
                        </label>

                        {confirmPassword.length > 0 &&
                            password !== confirmPassword ? (
                            <p className="reset-password-inline-error">
                                {t("resetPassword.mismatch")}
                            </p>
                        ) : null}

                        {error ? (
                            <div className="reset-password-error">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            className="reset-password-primary"
                            disabled={!valid || loading}
                        >
                            {loading
                                ? t("resetPassword.loading")
                                : t("resetPassword.button")}
                        </button>

                        <button
                            type="button"
                            className="reset-password-back"
                            onClick={() => navigate("/login")}
                        >
                            {t("resetPassword.back")}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
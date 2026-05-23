import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../lib/config";
import { initGoogleButton } from "../lib/googleAuth";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/Login.css";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const googleBtnRef = useRef(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const emailIsValid = useMemo(() => {
        if (!email.trim()) return true;
        return /\S+@\S+\.\S+/.test(email);
    }, [email]);

    const passwordIsValid = useMemo(() => {
        if (!password) return true;
        return password.length >= 6;
    }, [password]);

    const passwordsMatch = useMemo(() => {
        if (!confirmPassword) return true;
        return password === confirmPassword;
    }, [password, confirmPassword]);

    const finishSocialAuth = (data) => {
        if (!data?.token || !data?.user) {
            setError(t("register.errors.createFailed"));
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        setSuccess(true);
        setError("");

        setTimeout(() => {
            if (data.user?.isAdmin) {
                navigate("/admin/dashboard");
                return;
            }

            if (!data.user.onboardingCompleted) {
                navigate("/onboarding");
            } else if (!data.user.profileCompleted) {
                navigate("/dashboard/create-profile");
            } else {
                navigate("/dashboard/ai-tutor");
            }
        }, 700);
    };

    useEffect(() => {
        let mounted = true;

        initGoogleButton(
            googleBtnRef.current,
            (data) => {
                if (!mounted) return;
                setLoading(false);
                setError("");
                finishSocialAuth(data);
            },
            (message) => {
                if (!mounted) return;
                setLoading(false);
                setError(message || t("register.googleNotCompleted"));
            }
        );

        return () => {
            mounted = false;
        };
    }, [t]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError(t("register.errors.fillFields"));
            return;
        }

        if (!emailIsValid) {
            setError(t("register.errors.invalidEmail"));
            return;
        }

        if (!passwordIsValid) {
            setError(t("register.errors.passwordShort"));
            return;
        }

        if (!passwordsMatch) {
            setError(t("register.errors.passwordsMatch"));
            return;
        }

        try {
            setLoading(true);

            const cleanEmail = email.trim().toLowerCase();

            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: cleanEmail,
                    password,
                }),
            });

            const rawText = await res.text();
            let data = {};

            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                setError(t("register.errors.createFailed"));
                return;
            }

            if (!res.ok) {
                setError(data?.msg || t("register.errors.createFailed"));
                return;
            }

            setSuccess(true);

            setTimeout(() => {
                navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
            }, 700);
        } catch (err) {
            console.error("REGISTER ERROR:", err);
            setError(t("register.errors.network"));
        } finally {
            setLoading(false);
        }
    };

    const handleAppleRegister = () => {
        setError(t("register.appleComingSoon"));
    };

    return (
        <div className={`login-page ${success ? "login-page-success" : ""}`}>
            <div className="login-card">
                <div className="login-left">
                    <p className="login-kicker">{t("register.kicker")}</p>

                    <h1>{t("register.title")}</h1>

                    <p className="login-subtitle">{t("register.subtitle")}</p>

                    <form className="login-form" onSubmit={handleRegister}>
                        <div className="login-field">
                            <label>{t("register.name")}</label>
                            <input
                                type="text"
                                placeholder={t("register.namePlaceholder")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading || success}
                                autoComplete="name"
                            />
                        </div>

                        <div className="login-field">
                            <label>{t("register.email")}</label>
                            <input
                                type="email"
                                placeholder={t("register.emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || success}
                                autoComplete="email"
                                className={!emailIsValid && email.length > 0 ? "input-error" : ""}
                            />
                            {!emailIsValid && email.length > 0 ? (
                                <small className="login-helper-error">
                                    {t("register.errors.invalidEmail")}
                                </small>
                            ) : null}
                        </div>

                        <div className="login-field">
                            <label>{t("register.password")}</label>
                            <div className="login-password-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t("register.passwordPlaceholder")}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading || success}
                                    autoComplete="new-password"
                                    className={!passwordIsValid && password.length > 0 ? "input-error" : ""}
                                />

                                <button
                                    type="button"
                                    className="login-toggle-btn"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    disabled={loading || success}
                                >
                                    {showPassword ? t("register.hide") : t("register.show")}
                                </button>
                            </div>

                            {!passwordIsValid && password.length > 0 ? (
                                <small className="login-helper-error">
                                    {t("register.errors.passwordShort")}
                                </small>
                            ) : (
                                <small className="login-helper-text">
                                    {t("register.passwordHint")}
                                </small>
                            )}
                        </div>

                        <div className="login-field">
                            <label>{t("register.confirmPassword")}</label>
                            <div className="login-password-wrap">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder={t("register.confirmPasswordPlaceholder")}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading || success}
                                    autoComplete="new-password"
                                    className={!passwordsMatch && confirmPassword.length > 0 ? "input-error" : ""}
                                />

                                <button
                                    type="button"
                                    className="login-toggle-btn"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    disabled={loading || success}
                                >
                                    {showConfirmPassword ? t("register.hide") : t("register.show")}
                                </button>
                            </div>

                            {!passwordsMatch && confirmPassword.length > 0 ? (
                                <small className="login-helper-error">
                                    {t("register.errors.passwordsMatch")}
                                </small>
                            ) : null}
                        </div>

                        {error ? <div className="login-error">{error}</div> : null}

                        <button
                            type="submit"
                            className={`login-submit-btn ${loading ? "loading" : ""}`}
                            disabled={loading || success}
                        >
                            {success
                                ? t("register.success")
                                : loading
                                    ? t("register.loading")
                                    : t("register.createButton")}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>{t("register.orSignup")}</span>
                    </div>

                    <div className="social-login-buttons">
                        <div className="google-btn-shell">
                            <div ref={googleBtnRef} className="google-btn-render" />
                        </div>

                        <button
                            type="button"
                            className="social-btn apple"
                            onClick={handleAppleRegister}
                            disabled={loading || success}
                        >
                            <span className="social-btn-icon"></span>
                            <span className="social-btn-text">
                                {t("register.continueWithApple")}
                            </span>
                        </button>
                    </div>

                    <p className="login-footer-text">
                        {t("register.haveAccount")}{" "}
                        <Link to="/login" className="login-link">
                            {t("register.signIn")}
                        </Link>
                    </p>
                </div>

                <div className="login-right">
                    <div className="login-right-content">
                        <div className="login-badge">TalSky Social</div>

                        <h2>{t("register.rightTitle")}</h2>
                        <p>{t("register.rightSubtitle")}</p>

                        <div className="login-feature-list">
                            <div className="login-feature-item">
                                <strong>{t("register.feature1Title")}</strong>
                                <span>{t("register.feature1Text")}</span>
                            </div>

                            <div className="login-feature-item">
                                <strong>{t("register.feature2Title")}</strong>
                                <span>{t("register.feature2Text")}</span>
                            </div>

                            <div className="login-feature-item">
                                <strong>{t("register.feature3Title")}</strong>
                                <span>{t("register.feature3Text")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`login-success-overlay ${success ? "show" : ""}`}>
                <div className="login-success-content">
                    <div className="login-success-ring">
                        <div className="login-success-check">✓</div>
                    </div>
                    <h3>{t("register.welcomeTitle")}</h3>
                    <p>{t("register.redirecting")}</p>
                </div>
            </div>
        </div>
    );
}
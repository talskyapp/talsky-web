import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../lib/config";
import { initGoogleButton } from "../lib/googleAuth";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const googleBtnRef = useRef(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const finishLogin = (data) => {
        if (!data?.token || !data?.user) {
            setError(t("login.errors.generic") || t("login.somethingWentWrong"));
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
                navigate("/dashboard/feed");
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
                finishLogin(data);
            },
            (message) => {
                if (!mounted) return;
                setLoading(false);
                setError(message || t("login.googleNotCompleted"));
            }
        );

        return () => {
            mounted = false;
        };
    }, [t]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError(t("login.errors.fillFields") || t("login.fillAllFields"));
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const rawText = await res.text();
            let data = {};

            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                setError(t("login.errors.invalidServer") || t("login.somethingWentWrong"));
                return;
            }

            if (!res.ok) {
                if (data?.needsEmailVerification) {
                    navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
                    return;
                }

                if (data?.code === "ACCOUNT_SUSPENDED") {
                    setError(
                        t("login.errors.accountSuspended")
                    );
                    return;
                }

                if (data?.code === "ACCOUNT_DELETED") {
                    setError(
                        t("login.errors.accountDeleted")
                    );
                    return;
                }

                setError(
                    data?.msg ||
                    t("login.errors.invalidCredentials") ||
                    t("login.invalidCredentials")
                );
                return;
            }

            finishLogin(data);
        } catch (err) {
            console.error("LOGIN ERROR:", err);
            setError(t("login.errors.network") || t("login.somethingWentWrong"));
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = () => {
        setError(t("login.appleComingSoon"));
    };

    return (
        <div className={`login-page ${success ? "login-page-success" : ""}`}>
            <div className="login-card">
                <div className="login-left">
                    <p className="login-kicker">{t("login.kicker")}</p>

                    <h1>{t("login.title")}</h1>

                    <p className="login-subtitle">{t("login.subtitle")}</p>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="login-field">
                            <label>{t("login.email")}</label>
                            <input
                                type="email"
                                placeholder={t("login.emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || success}
                                autoComplete="email"
                            />
                        </div>

                        <div className="login-field">
                            <label>{t("login.password")}</label>
                            <input
                                type="password"
                                placeholder={t("login.passwordPlaceholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || success}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="login-forgot-row">
                            <Link to="/forgot-password" className="login-forgot-link">
                                {t("login.forgotPassword")}
                            </Link>
                        </div>

                        {error ? <div className="login-error">{error}</div> : null}

                        <button
                            type="submit"
                            className={`login-submit-btn ${loading ? "loading" : ""}`}
                            disabled={loading || success}
                        >
                            {success
                                ? t("login.success")
                                : loading
                                    ? t("login.signingIn")
                                    : t("login.loginButton")}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>{t("login.orContinueWith")}</span>
                    </div>

                    <div className="social-login-buttons">
                        <div className="google-btn-shell">
                            <div ref={googleBtnRef} className="google-btn-render" />
                        </div>

                        <button
                            type="button"
                            className="social-btn apple"
                            onClick={handleAppleLogin}
                            disabled={loading || success}
                        >
                            <span className="social-btn-icon"></span>
                            <span className="social-btn-text">
                                {t("login.continueWithApple")}
                            </span>
                        </button>
                    </div>

                    <p className="login-footer-text">
                        {t("login.noAccount")}{" "}
                        <Link to="/register" className="login-link">
                            {t("login.createOne")}
                        </Link>
                    </p>
                </div>

                <div className="login-right">
                    <div className="login-right-content">
                        <div className="login-badge">TalSky Social</div>

                        <h2>{t("login.rightTitle")}</h2>

                        <p>{t("login.rightSubtitle")}</p>

                        <div className="login-feature-list">
                            <div className="login-feature-item">
                                <strong>{t("login.feature1Title")}</strong>
                                <span>{t("login.feature1Text")}</span>
                            </div>

                            <div className="login-feature-item">
                                <strong>{t("login.feature2Title")}</strong>
                                <span>{t("login.feature2Text")}</span>
                            </div>

                            <div className="login-feature-item">
                                <strong>{t("login.feature3Title")}</strong>
                                <span>{t("login.feature3Text")}</span>
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
                    <h3>{t("login.welcomeTitle")}</h3>
                    <p>{t("login.welcomeText")}</p>
                </div>
            </div>
        </div>
    );
}
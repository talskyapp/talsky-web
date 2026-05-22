import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/Pricing.css";

export default function Pricing() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useOutletContext() || {};
    const { t } = useTranslation();

    const [loadingPlan, setLoadingPlan] = useState("");
    const [portalLoading, setPortalLoading] = useState(false);
    const [error, setError] = useState("");

    const canceled = searchParams.get("canceled") === "true";

    const isPro =
        user?.subscription?.plan === "pro" &&
        ["active", "trialing", "past_due"].includes(user?.subscription?.status);

    const currentPlanText = useMemo(() => {
        if (!user?.subscription) return t("pricing.free");
        return isPro ? t("pricing.pro") : t("pricing.free");
    }, [user, isPro, t]);

    const activeBillingPlan = useMemo(() => {
        const stripePriceId = user?.subscription?.stripePriceId || "";

        if (stripePriceId) {
            if (stripePriceId === import.meta.env.VITE_STRIPE_PRICE_MONTHLY) return "monthly";
            if (stripePriceId === import.meta.env.VITE_STRIPE_PRICE_6MONTHS) return "6months";
            if (stripePriceId === import.meta.env.VITE_STRIPE_PRICE_YEARLY) return "yearly";
        }

        return "";
    }, [user?.subscription?.stripePriceId]);

    const plans = useMemo(
        () => [
            {
                id: "monthly",
                name: t("pricing.plans.monthly.name"),
                price: "$12.99",
                period: t("pricing.plans.monthly.period"),
                description: t("pricing.plans.monthly.description"),
                features: [
                    t("pricing.features.unlimitedChats"),
                    t("pricing.features.nearbyAccess"),
                    t("pricing.features.advancedFilters"),
                    t("pricing.features.profileBoost"),
                ],
                highlight: false,
                savings: null,
            },
            {
                id: "6months",
                name: t("pricing.plans.sixMonths.name"),
                price: "$59.99",
                period: t("pricing.plans.sixMonths.period"),
                description: t("pricing.plans.sixMonths.description"),
                features: [
                    t("pricing.features.unlimitedChats"),
                    t("pricing.features.nearbyAccess"),
                    t("pricing.features.advancedFilters"),
                    t("pricing.features.profileBoost"),
                ],
                highlight: true,
                savings: t("pricing.plans.sixMonths.badge"),
            },
            {
                id: "yearly",
                name: t("pricing.plans.yearly.name"),
                price: "$99.99",
                period: t("pricing.plans.yearly.period"),
                description: t("pricing.plans.yearly.description"),
                features: [
                    t("pricing.features.unlimitedChats"),
                    t("pricing.features.nearbyAccess"),
                    t("pricing.features.advancedFilters"),
                    t("pricing.features.profileBoost"),
                ],
                highlight: false,
                savings: t("pricing.plans.yearly.badge"),
            },
        ],
        [t]
    );

    const handleUpgrade = async (plan) => {
        try {
            setError("");
            setLoadingPlan(plan);

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error(t("pricing.errors.loginRequired"));
            }

            const res = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ plan }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || t("pricing.errors.checkoutFailed"));
            }

            window.location.href = data.url;
        } catch (err) {
            console.error("Checkout error:", err);
            setError(err.message || t("pricing.errors.generic"));
            setLoadingPlan("");
        }
    };

    const handleManageSubscription = async () => {
        try {
            setError("");
            setPortalLoading(true);

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error(t("pricing.errors.loginRequired"));
            }

            const res = await fetch(`${API_URL}/api/billing/create-portal-session`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || t("pricing.errors.portalFailed"));
            }

            window.location.href = data.url;
        } catch (err) {
            console.error("Portal error:", err);
            setError(err.message || t("pricing.errors.generic"));
            setPortalLoading(false);
        }
    };

    return (
        <div className="pricing-page">
            <div className="pricing-hero">
                <div className="pricing-badge">{t("pricing.badge")}</div>

                <h1>{t("pricing.title")}</h1>

                <p>{t("pricing.subtitle")}</p>

                <div className="pricing-status-card">
                    <span className="pricing-status-label">{t("pricing.currentPlanLabel")}</span>
                    <strong className="pricing-status-value">{currentPlanText}</strong>
                </div>

                {isPro && (
                    <div className="pricing-notice success">
                        {t("pricing.activeNotice")}
                    </div>
                )}

                {canceled && (
                    <div className="pricing-notice warning">
                        {t("pricing.checkoutCanceled")}
                    </div>
                )}

                {error && <div className="pricing-notice error">{error}</div>}
            </div>

            <div className="pricing-grid">
                {plans.map((plan) => {
                    const isCurrentPaidPlan = isPro && activeBillingPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`pricing-card ${plan.highlight ? "highlight" : ""} ${isCurrentPaidPlan ? "current-plan" : ""
                                }`}
                        >
                            {plan.savings && (
                                <div className="pricing-card-badge">{plan.savings}</div>
                            )}

                            {isCurrentPaidPlan && (
                                <div className="pricing-current-badge">
                                    {t("pricing.currentPlanBadge")}
                                </div>
                            )}

                            <h2>{plan.name}</h2>

                            <div className="pricing-price-row">
                                <span className="pricing-price">{plan.price}</span>
                                <span className="pricing-period">{plan.period}</span>
                            </div>

                            <p className="pricing-description">{plan.description}</p>

                            <div className="pricing-divider" />

                            <ul className="pricing-features">
                                {plan.features.map((feature) => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>

                            {!isPro && (
                                <button
                                    className="pricing-btn"
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loadingPlan === plan.id}
                                >
                                    {loadingPlan === plan.id
                                        ? t("pricing.redirecting")
                                        : t("pricing.choosePlan", { plan: plan.name })}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {isPro && (
                <div className="pricing-manage-box">
                    <h3>{t("pricing.manageTitle")}</h3>
                    <p>{t("pricing.manageSubtitle")}</p>

                    <button
                        className="pricing-manage-btn"
                        onClick={handleManageSubscription}
                        disabled={portalLoading || !!loadingPlan}
                    >
                        {portalLoading
                            ? t("pricing.opening")
                            : t("pricing.manageButton")}
                    </button>
                </div>
            )}

            <div className="pricing-footer-actions">
                <button className="pricing-back-btn" onClick={() => navigate(-1)}>
                    {t("pricing.goBack")}
                </button>
            </div>
        </div>
    );
}
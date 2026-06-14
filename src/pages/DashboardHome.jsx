import { Link, useOutletContext } from "react-router-dom";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import {
    Sparkles,
    BookOpen,
    Layers3,
    Brain,
    Smartphone,
    ArrowRight,
    MessageCircle,
    Globe2,
} from "lucide-react";
import "../styles/DashboardHome.css";
import { useTranslation } from "../hooks/useTranslation";

export default function DashboardHome() {
    const { user } = useOutletContext();
    const { t } = useTranslation();

    const name = user?.name?.split(" ")?.[0] || t("dashboardHome.fallbackName");
    const learning = user?.languageToLearn?.[0] || t("dashboardHome.fallbackLanguage");
    const steps = [
        {
            number: "01",
            icon: <MessageCircle size={22} />,
            title: t("dashboardHome.steps.practiceTitle"),
            text: t("dashboardHome.steps.practiceText"),
        },
        {
            number: "02",
            icon: <Layers3 size={22} />,
            title: t("dashboardHome.steps.saveTitle"),
            text: t("dashboardHome.steps.saveText"),
        },
        {
            number: "03",
            icon: <Brain size={22} />,
            title: t("dashboardHome.steps.reviewTitle"),
            text: t("dashboardHome.steps.reviewText"),
        },
    ];

    return (
        <div className="dash-home">
            <section className="dash-hero-pro">
                <div className="dash-hero-copy">
                    <span className="dash-home-pill">
                        <Sparkles size={15} />
                        {t("dashboardHome.pill")}
                    </span>

                    <h1>{t("dashboardHome.welcome", { name })}</h1>

                    <p>
                        {t("dashboardHome.subtitle", { learning })}
                    </p>

                    <div className="dash-home-actions">
                        <Link to="/dashboard/ai-tutor" className="dash-home-primary">
                            {t("dashboardHome.startTutor")}
                            <ArrowRight size={18} />
                        </Link>

                        <Link to="/dashboard/cards/review" className="dash-home-secondary">
                            {t("dashboardHome.reviewCards")}
                        </Link>
                    </div>
                </div>

                <div className="dash-hero-preview">
                    <div className="dash-preview-glow" />

                    <div className="dash-preview-card top">
                        <span>{t("dashboardHome.todaysFocus")}</span>
                        <strong>{t("dashboardHome.focusTitle")}</strong>
                    </div>

                    <div className="dash-preview-card middle">
                        <div className="dash-ai-icon">
                            <Sparkles size={24} />
                        </div>

                        <h3>{t("dashboardHome.aiTutorTitle")}</h3>
                        <p>{t("dashboardHome.aiTutorPreview")}</p>
                    </div>

                    <div className="dash-preview-card bottom">
                        <span>{t("dashboardHome.savedWords")}</span>
                        <strong>{t("dashboardHome.savedWordsReady")}</strong>
                    </div>
                </div>
            </section>

            <section className="dash-flow-section">
                <div className="dash-section-head">
                    <span>{t("dashboardHome.howItWorks")}</span>
                    <h2>{t("dashboardHome.flowTitle")}</h2>
                    <p>{t("dashboardHome.flowText")}</p>
                </div>

                <div className="dash-flow-grid">
                    {steps.map((step, index) => (
                        <div className="dash-flow-card" key={step.title}>
                            <div className="dash-flow-top">
                                <span>{step.number}</span>
                                <div className="dash-flow-icon">{step.icon}</div>
                            </div>

                            <h3>{step.title}</h3>
                            <p>{step.text}</p>

                            {index < steps.length - 1 && (
                                <div className="dash-flow-arrow">
                                    <ArrowRight size={18} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="dash-home-grid pro">
                <Link to="/dashboard/ai-tutor" className="dash-home-card main">
                    <div className="dash-card-icon">
                        <Sparkles size={24} />
                    </div>

                    <span>{t("dashboardHome.cards.aiLabel")}</span>
                    <h3>{t("dashboardHome.cards.aiTitle")}</h3>
                    <p>{t("dashboardHome.cards.aiText")}</p>
                </Link>

                <Link to="/dashboard/cards" className="dash-home-card">
                    <div className="dash-card-icon">
                        <BookOpen size={24} />
                    </div>

                    <span>{t("dashboardHome.cards.vocabLabel")}</span>
                    <h3>{t("dashboardHome.cards.vocabTitle")}</h3>
                    <p>{t("dashboardHome.cards.vocabText")}</p>
                </Link>

                <Link to="/dashboard/cards/review" className="dash-home-card">
                    <div className="dash-card-icon">
                        <Brain size={24} />
                    </div>

                    <span>{t("dashboardHome.cards.reviewLabel")}</span>
                    <h3>{t("dashboardHome.cards.reviewTitle")}</h3>
                    <p>{t("dashboardHome.cards.reviewText")}</p>
                </Link>

                <div className="dash-home-card disabled">
                    <div className="dash-card-icon">
                        <Globe2 size={24} />
                    </div>

                    <span>{t("dashboardHome.cards.mobileLabel")}</span>
                    <h3>{t("dashboardHome.cards.mobileTitle")}</h3>
                    <p>{t("dashboardHome.cards.mobileText")}</p>
                </div>
            </section>

            <section className="dash-home-mobile">
                <div className="dash-mobile-copy">
                    <span>{t("dashboardHome.mobile.label")}</span>

                    <h2>{t("dashboardHome.mobile.title")}</h2>

                    <p>{t("dashboardHome.mobile.text")}</p>
                </div>

                <div className="dash-store-buttons">
                    <a href="#" className="dash-store-btn">
                        <FaApple className="dash-store-real-icon" />

                        <div>
                            <small>{t("dashboardHome.mobile.appStoreSmall")}</small>
                            <strong>{t("dashboardHome.mobile.appStore")}</strong>
                        </div>
                    </a>

                    <a href="#" className="dash-store-btn">
                        <FaGooglePlay className="dash-store-real-icon" />

                        <div>
                            <small>{t("dashboardHome.mobile.googleSmall")}</small>
                            <strong>{t("dashboardHome.mobile.googlePlay")}</strong>
                        </div>
                    </a>
                </div>
            </section>
        </div>
    );
}
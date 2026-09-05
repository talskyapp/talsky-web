import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import {
    Sparkles,
    BookOpen,
    Layers3,
    Brain,
    ArrowRight,
    ArrowLeft,
    MessageCircle,
    Globe2,
    Volume2,
    Check,
} from "lucide-react";
import "../styles/DashboardHome.css";
import { useTranslation } from "../hooks/useTranslation";

/**
 * Phone-mockup content for the "how it works" carousel.
 * Pure CSS/SVG — no external image assets to load or break.
 */
function ChatMockup() {
    return (
        <div className="dm-phone-screen dm-phone-chat">
            <div className="dm-bubble dm-bubble-them">
                <span className="dm-flag">🇪🇸</span> ¿Cómo se dice "excited" en español?
            </div>
            <div className="dm-bubble dm-bubble-me">
                Se dice <strong>"emocionado"</strong> — ¡fácil!
                <span className="dm-flag">🇬🇧</span>
            </div>
            <div className="dm-typing">
                <span /><span /><span />
            </div>
        </div>
    );
}

function CardMockup() {
    return (
        <div className="dm-phone-screen dm-phone-cards">
            <div className="dm-vocab-card front">
                <span className="dm-vocab-label">word</span>
                <strong>emocionado</strong>
                <span className="dm-vocab-sub">excited</span>
            </div>
            <div className="dm-vocab-card back">
                <span className="dm-vocab-label">usage</span>
                <p>"Estoy emocionado por el viaje."</p>
            </div>
        </div>
    );
}

function ReviewMockup() {
    return (
        <div className="dm-phone-screen dm-phone-review">
            <div className="dm-review-row done">
                <span>emocionado</span>
                <Check size={14} />
            </div>
            <div className="dm-review-row dim">
                <span>agradecido</span>
                <Check size={14} />
            </div>
            <div className="dm-review-row active">
                <span>desafiante</span>
                <div className="dm-review-dot" />
            </div>
            <div className="dm-review-progress">
                <div className="dm-review-progress-fill" />
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const { user } = useOutletContext();
    const { t } = useTranslation();

    const name = user?.name?.split(" ")?.[0] || t("dashboardHome.fallbackName");
    const learning = user?.languageToLearn?.[0] || t("dashboardHome.fallbackLanguage");

    const aiTutorBetaOnly =
        import.meta.env.VITE_AI_TUTOR_BETA_ONLY !== "false";

    const testerExpiresAt =
        user?.testerAccess?.expiresAt
            ? new Date(user.testerAccess.expiresAt)
            : null;

    const testerAccessExpired =
        testerExpiresAt &&
        !Number.isNaN(testerExpiresAt.getTime()) &&
        testerExpiresAt <= new Date();

    const hasAiTutorAccess =
        !aiTutorBetaOnly ||
        user?.isAdmin === true ||
        (
            user?.testerAccess?.enabled === true &&
            user?.testerAccess?.aiTutor === true &&
            !testerAccessExpired
        );

    const steps = [
        {
            number: "01",
            icon: <MessageCircle size={22} />,
            title: t("dashboardHome.steps.practiceTitle"),
            text: t("dashboardHome.steps.practiceText"),
            mockup: <ChatMockup />,
        },
        {
            number: "02",
            icon: <Layers3 size={22} />,
            title: t("dashboardHome.steps.saveTitle"),
            text: t("dashboardHome.steps.saveText"),
            mockup: <CardMockup />,
        },
        {
            number: "03",
            icon: <Brain size={22} />,
            title: t("dashboardHome.steps.reviewTitle"),
            text: t("dashboardHome.steps.reviewText"),
            mockup: <ReviewMockup />,
        },
    ];

    // --- "How it works" carousel state ---
    const [activeStep, setActiveStep] = useState(0);
    const resumeTimeoutRef = useRef(null);
    const pausedRef = useRef(false);

    useEffect(() => {
        const id = setInterval(() => {
            if (pausedRef.current) return;
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 4500);
        return () => clearInterval(id);
    }, [steps.length]);

    const goToStep = (index) => {
        pausedRef.current = true;
        setActiveStep((index + steps.length) % steps.length);
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = window.setTimeout(() => {
            pausedRef.current = false;
        }, 6000);
    };

    if (!hasAiTutorAccess) {
        return (
            <div className="dash-home">
                <section className="dash-beta-locked">
                    <div className="dash-beta-copy">
                        <span className="dash-home-pill">
                            <Sparkles size={15} />
                            TalSky AI Private Beta
                        </span>

                        <h1>
                            TalSky AI is getting ready.
                        </h1>

                        <p>
                            We’re currently testing guided conversations,
                            vocabulary tools, voice practice, and personalised
                            feedback with a small group of testers.
                        </p>

                        <div className="dash-beta-status">
                            <div className="dash-beta-status-icon">
                                <Brain size={22} />
                            </div>

                            <div>
                                <strong>Limited tester access</strong>
                                <span>
                                    TalSky AI will become available after
                                    testing is complete.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="dash-beta-preview">
                        <div className="dash-preview-glow" />

                        <div className="dash-beta-preview-card">
                            <div className="dash-ai-icon">
                                <Sparkles size={26} />
                            </div>

                            <span>COMING SOON</span>
                            <h2>Practice naturally with TalSky AI</h2>

                            <p>
                                Real conversations, pronunciation practice,
                                useful vocabulary and personalised learning
                                support.
                            </p>

                            <div className="dash-beta-features">
                                <span>
                                    <MessageCircle size={16} />
                                    AI conversations
                                </span>

                                <span>
                                    <Volume2 size={16} />
                                    Voice practice
                                </span>

                                <span>
                                    <Layers3 size={16} />
                                    Vocabulary cards
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

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

            {/* HOW IT WORKS — now an interactive carousel with phone mockups */}
            <section className="dash-flow-section">
                <div className="dash-section-head">
                    <span>{t("dashboardHome.howItWorks")}</span>
                    <h2>{t("dashboardHome.flowTitle")}</h2>
                    <p>{t("dashboardHome.flowText")}</p>
                </div>

                <div
                    className="dm-carousel"
                    onMouseEnter={() => (pausedRef.current = true)}
                    onMouseLeave={() => (pausedRef.current = false)}
                >
                    <button
                        type="button"
                        className="dash-flow-arrow dm-carousel-arrow left"
                        aria-label="Previous step"
                        onClick={() => goToStep(activeStep - 1)}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className="dm-carousel-viewport">
                        <div
                            className="dm-carousel-track"
                            style={{ transform: `translateX(-${activeStep * 100}%)` }}
                        >
                            {steps.map((step) => (
                                <div className="dash-flow-card dm-slide" key={step.title}>
                                    <div className="dm-slide-phone">
                                        <div className="dm-phone-notch" />
                                        {step.mockup}
                                    </div>

                                    <div className="dm-slide-copy">
                                        <div className="dash-flow-top">
                                            <span>{step.number}</span>
                                            <div className="dash-flow-icon">{step.icon}</div>
                                        </div>

                                        <h3>{step.title}</h3>
                                        <p>{step.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="dash-flow-arrow dm-carousel-arrow right"
                        aria-label="Next step"
                        onClick={() => goToStep(activeStep + 1)}
                    >
                        <ArrowRight size={16} />
                    </button>
                </div>

                <div className="dm-carousel-dots">
                    {steps.map((step, index) => (
                        <button
                            type="button"
                            key={step.number}
                            className={`dm-dot ${index === activeStep ? "active" : ""}`}
                            aria-label={`Go to step ${index + 1}`}
                            onClick={() => goToStep(index)}
                        />
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
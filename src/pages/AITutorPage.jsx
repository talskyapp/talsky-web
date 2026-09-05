import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    Bot,
    Mic,
    BookOpen,
    MessagesSquare,
    Languages,
    Brain,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/AITutorPage.css";

export default function AITutorPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const starterModes = [
        {
            id: "free-chat",
            icon: <MessagesSquare size={18} />,
            title: t("aiTutor.modes.freeChat.title"),
            subtitle: t("aiTutor.modes.freeChat.subtitle"),
        },
        {
            id: "corrections",
            icon: <CheckCircle2 size={18} />,
            title: t("aiTutor.modes.corrections.title"),
            subtitle: t("aiTutor.modes.corrections.subtitle"),
        },
        {
            id: "roleplay",
            icon: <Bot size={18} />,
            title: t("aiTutor.modes.roleplay.title"),
            subtitle: t("aiTutor.modes.roleplay.subtitle"),
        },
        {
            id: "vocab",
            icon: <BookOpen size={18} />,
            title: t("aiTutor.modes.vocab.title"),
            subtitle: t("aiTutor.modes.vocab.subtitle"),
        },
    ];

    const goToMode = (modeId) => {
        navigate(`/dashboard/ai-chat?mode=${modeId}`);
    };

    return (
        <div className="ai-tutor-page">
            <div className="ai-tutor-shell simple">

                <section className="ai-simple-hero">
                    <div className="ai-simple-hero-copy">
                        <div className="ai-tutor-kicker">
                            <Sparkles size={16} />
                            <span>{t("aiTutor.hero.kicker")}</span>
                        </div>

                        <h1>{t("aiTutor.hero.title")}</h1>

                        <p className="ai-tutor-subtitle">
                            {t("aiTutor.hero.subtitle")}
                        </p>

                        <div className="ai-tutor-hero-pills">
                            <span className="ai-tutor-pill">
                                <Languages size={15} />
                                {t("aiTutor.hero.pill1")}
                            </span>

                            <span className="ai-tutor-pill">
                                <BookOpen size={15} />
                                {t("aiTutor.hero.pill2")}
                            </span>

                            <span className="ai-tutor-pill">
                                <Mic size={15} />
                                {t("aiTutor.hero.pill3")}
                            </span>
                        </div>
                    </div>

                    <div className="ai-hero-logo-panel">
                        <div className="ai-hero-glow" />

                        <div className="ai-cloud-brand">
                            <img
                                src="/talsky-ai-logo.png"
                                alt="TalSky AI"
                                className="ai-hero-logo"
                            />
                        </div>

                        <button
                            type="button"
                            className="ai-simple-primary"
                            onClick={() => goToMode("free-chat")}
                        >
                            {t("aiTutor.modes.freeChat.title")}
                            <Sparkles size={18} />
                        </button>

                        <div className="ai-hero-mini-actions">

                            <button
                                type="button"
                                onClick={() => navigate("/dashboard/cards")}
                            >
                                <BookOpen size={18} />
                                {t("aiTutor.hero.openCards")}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/dashboard/cards/review")
                                }
                            >
                                <Brain size={18} />
                                {t("aiTutor.stats.quiz.title")}
                            </button>

                        </div>
                    </div>
                </section>

                <section className="ai-card ai-mode-card">
                    <div className="ai-card-head">
                        <div>
                            <p className="ai-section-kicker">
                                {t("aiTutor.start.kicker")}
                            </p>

                            <h3>
                                {t("aiTutor.start.title")}
                            </h3>
                        </div>
                    </div>

                    <div className="ai-mode-grid simple">
                        {starterModes.map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                className="ai-mode-option"
                                onClick={() => goToMode(mode.id)}
                            >
                                <div className="ai-mode-icon">
                                    {mode.icon}
                                </div>

                                <div className="ai-mode-copy">
                                    <strong>
                                        {mode.title}
                                    </strong>

                                    <span>
                                        {mode.subtitle}
                                    </span>
                                </div>

                                <div className="ai-mode-go">
                                    <ArrowRight size={16} />
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="ai-card ai-side-pro simple">
                    <div>
                        <div className="ai-side-pro-badge">
                            <Sparkles size={12} />
                            PRO
                        </div>

                        <h3>
                            {t("aiTutor.pro.title")}
                        </h3>

                        <p>
                            {t("aiTutor.pro.text")}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ai-pro-btn"
                    >
                        {t("aiTutor.pro.button")}
                        <ArrowRight size={16} />
                    </button>
                </section>

            </div>
        </div>
    );
}
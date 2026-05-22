import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    Bot,
    Mic,
    BookOpen,
    Wand2,
    MessagesSquare,
    Languages,
    PencilLine,
    Volume2,
    Brain,
    CheckCircle2,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/AITutorPage.css";

export default function AITutorPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [selectedMode, setSelectedMode] = useState("free-chat");

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

    const quickActions = [
        {
            id: "save-card",
            icon: <Wand2 size={18} />,
            title: t("aiTutor.actions.cards.title"),
            text: t("aiTutor.actions.cards.text"),
        },
        {
            id: "pronunciation",
            icon: <Volume2 size={18} />,
            title: t("aiTutor.actions.pronunciation.title"),
            text: t("aiTutor.actions.pronunciation.text"),
        },
        {
            id: "writing",
            icon: <PencilLine size={18} />,
            title: t("aiTutor.actions.writing.title"),
            text: t("aiTutor.actions.writing.text"),
        },
        {
            id: "quiz",
            icon: <Brain size={18} />,
            title: t("aiTutor.actions.quiz.title"),
            text: t("aiTutor.actions.quiz.text"),
        },
    ];

    const selectedModeData = useMemo(
        () => starterModes.find((mode) => mode.id === selectedMode) || starterModes[0],
        [selectedMode]
    );

    const handleModeSelect = (modeId) => {
        setSelectedMode(modeId);
        navigate(`/dashboard/ai-chat?mode=${modeId}`);
    };

    return (
        <div className="ai-tutor-page">
            <div className="ai-tutor-shell">

                {/* HERO */}
                <section className="ai-tutor-hero">
                    <div className="ai-tutor-hero-copy">
                        <div className="ai-tutor-kicker">
                            <Sparkles size={16} />
                            <span>{t("aiTutor.hero.kicker")}</span>
                        </div>

                        <h1>{t("aiTutor.hero.title")}</h1>

                        <button
                            type="button"
                            className="ai-chat-tool-btn"
                            onClick={() => navigate("/dashboard/cards")}
                        >
                            <BookOpen size={16} />
                            <span>{t("aiTutor.hero.openCards")}</span>
                        </button>

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

                    <div className="ai-tutor-hero-card">
                        <div className="ai-tutor-orb" />
                        <div className="ai-tutor-hero-card-inner">
                            <div className="ai-tutor-bot-icon">
                                <Bot size={28} />
                            </div>

                            <h2>{t("aiTutor.hero.cardTitle")}</h2>
                            <p>{t("aiTutor.hero.cardText")}</p>

                            <div className="ai-tutor-mini-stats">
                                <div className="ai-mini-stat">
                                    <strong>{t("aiTutor.stats.chat.title")}</strong>
                                    <span>{t("aiTutor.stats.chat.text")}</span>
                                </div>
                                <div className="ai-mini-stat">
                                    <strong>{t("aiTutor.stats.cards.title")}</strong>
                                    <span>{t("aiTutor.stats.cards.text")}</span>
                                </div>
                                <div className="ai-mini-stat">
                                    <strong>{t("aiTutor.stats.quiz.title")}</strong>
                                    <span>{t("aiTutor.stats.quiz.text")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MAIN */}
                <section className="ai-tutor-grid">
                    <div className="ai-tutor-main">

                        {/* MODES */}
                        <div className="ai-card ai-mode-card">
                            <div className="ai-card-head">
                                <div>
                                    <p className="ai-section-kicker">
                                        {t("aiTutor.start.kicker")}
                                    </p>
                                    <h3>{t("aiTutor.start.title")}</h3>
                                </div>
                            </div>

                            <div className="ai-mode-grid">
                                {starterModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        className={`ai-mode-option ${selectedMode === mode.id ? "active" : ""}`}
                                        onClick={() => handleModeSelect(mode.id)}
                                    >
                                        <div className="ai-mode-icon">{mode.icon}</div>
                                        <div className="ai-mode-copy">
                                            <strong>{mode.title}</strong>
                                            <span>{mode.subtitle}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TOOLS */}
                        <div className="ai-card ai-actions-card">
                            <div className="ai-card-head">
                                <div>
                                    <p className="ai-section-kicker">
                                        {t("aiTutor.tools.kicker")}
                                    </p>
                                    <h3>{t("aiTutor.tools.title")}</h3>
                                </div>
                            </div>

                            <div className="ai-actions-grid">
                                {quickActions.map((item) => (
                                    <div key={item.id} className="ai-action-tile">
                                        <div className="ai-action-icon">{item.icon}</div>
                                        <strong>{item.title}</strong>
                                        <p>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIDE */}
                    <aside className="ai-tutor-side">

                        <div className="ai-card ai-side-highlight">
                            <p className="ai-section-kicker">
                                {t("aiTutor.why.kicker")}
                            </p>
                            <h3>{t("aiTutor.why.title")}</h3>

                            <ul className="ai-feature-list">
                                <li>{t("aiTutor.why.item1")}</li>
                                <li>{t("aiTutor.why.item2")}</li>
                                <li>{t("aiTutor.why.item3")}</li>
                                <li>{t("aiTutor.why.item4")}</li>
                            </ul>
                        </div>

                        <div className="ai-card ai-side-preview">
                            <p className="ai-section-kicker">
                                {t("aiTutor.flow.kicker")}
                            </p>

                            <div className="ai-preview-step">
                                <span>1</span>
                                <div>
                                    <strong>{t("aiTutor.flow.step1.title")}</strong>
                                    <p>{t("aiTutor.flow.step1.text")}</p>
                                </div>
                            </div>

                            <div className="ai-preview-step">
                                <span>2</span>
                                <div>
                                    <strong>{t("aiTutor.flow.step2.title")}</strong>
                                    <p>{t("aiTutor.flow.step2.text")}</p>
                                </div>
                            </div>

                            <div className="ai-preview-step">
                                <span>3</span>
                                <div>
                                    <strong>{t("aiTutor.flow.step3.title")}</strong>
                                    <p>{t("aiTutor.flow.step3.text")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="ai-card ai-side-pro">
                            <div className="ai-side-pro-badge">PRO</div>

                            <h3>{t("aiTutor.pro.title")}</h3>
                            <p>{t("aiTutor.pro.text")}</p>

                            <button type="button" className="ai-pro-btn">
                                {t("aiTutor.pro.button")}
                            </button>
                        </div>

                    </aside>
                </section>
            </div>
        </div>
    );
}
import { useMemo } from "react";
import { useNavigate, useOutletContext, Navigate } from "react-router-dom";
import "../styles/CourseHub.css";

export default function CourseHub() {
    const navigate = useNavigate();
    const { user } = useOutletContext();

    const activeLanguage =
        user?.activeLearningLanguage || user?.languageToLearn?.[0] || "English";

    const sections = useMemo(() => {
        return [
            {
                title: "Vocabulary",
                description: "Review saved words, difficult words, and your personal word bank.",
                items: [
                    {
                        key: "saved-words",
                        title: "Saved Words",
                        subtitle: "Words you bookmarked during lessons",
                        icon: "🔖",
                        status: "Coming soon",
                        route: "/dashboard/course-hub/saved-words",
                    },
                    {
                        key: "difficult-words",
                        title: "Difficult Words",
                        subtitle: "Words you missed in lessons and tests",
                        icon: "🧠",
                        status: "Ready for UI",
                        route: "/dashboard/course-hub/difficult-words",
                    },
                    {
                        key: "review-deck",
                        title: "Review Deck",
                        subtitle: "Quick flashcard-style review",
                        icon: "🃏",
                        status: "Coming soon",
                        route: "/dashboard/course-hub/review-deck",
                    },
                ],
            },
            {
                title: "Practice Skills",
                description: "Train specific skills outside the normal lesson flow.",
                items: [
                    {
                        key: "speaking",
                        title: "Speaking",
                        subtitle: "Practice speaking with guided prompts",
                        icon: "🎤",
                        status: "Planned",
                        route: "/dashboard/course-hub/speaking",
                    },
                    {
                        key: "pronunciation",
                        title: "Pronunciation",
                        subtitle: "Improve clarity and accent step by step",
                        icon: "🗣️",
                        status: "Planned",
                        route: "/dashboard/course-hub/pronunciation",
                    },
                    {
                        key: "listening",
                        title: "Listening",
                        subtitle: "Short audios and listening drills",
                        icon: "🎧",
                        status: "Planned",
                        route: "/dashboard/course-hub/listening",
                    },
                ],
            },
            {
                title: "Pathways",
                description: "Explore learning by level, category, and structured practice.",
                items: [
                    {
                        key: "levels",
                        title: "Language Levels",
                        subtitle: "A1, A2, B1 and more structured pathways",
                        icon: "📚",
                        status: "Planned",
                        route: "/dashboard/course-hub/levels",
                    },
                    {
                        key: "grammar",
                        title: "Grammar Categories",
                        subtitle: "Practice grammar by topic",
                        icon: "✍️",
                        status: "Planned",
                        route: "/dashboard/course-hub/grammar",
                    },
                    {
                        key: "phrases",
                        title: "Useful Phrases",
                        subtitle: "Everyday expressions and examples",
                        icon: "💬",
                        status: "Planned",
                        route: "/dashboard/course-hub/phrases",
                    },
                ],
            },
        ];
    }, []);

    if (!user?.courseActivated) {
        return <Navigate to="/dashboard/learn" replace />;
    }

    return (
        <div className="course-hub-page">
            <div className="course-hub-shell">
                <div className="course-hub-hero">
                    <div>
                        <p className="course-hub-kicker">Course Hub</p>
                        <h1>{activeLanguage} Learning Hub</h1>
                        <p className="course-hub-subtitle">
                            Choose what you want to practice, review, or explore next.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="course-hub-back-btn"
                        onClick={() => navigate("/dashboard/learn/course")}
                    >
                        Back to course
                    </button>
                </div>

                <div className="course-hub-highlight-row">
                    <div className="course-hub-highlight-card primary">
                        <span className="course-hub-highlight-icon">🔖</span>
                        <div>
                            <strong>Saved Words</strong>
                            <p>Build your personal vocabulary bank.</p>
                        </div>
                    </div>

                    <div className="course-hub-highlight-card">
                        <span className="course-hub-highlight-icon">🧠</span>
                        <div>
                            <strong>Difficult Words</strong>
                            <p>Review mistakes from lessons and tests.</p>
                        </div>
                    </div>

                    <div className="course-hub-highlight-card">
                        <span className="course-hub-highlight-icon">🎤</span>
                        <div>
                            <strong>Speaking Lab</strong>
                            <p>Train speaking and pronunciation.</p>
                        </div>
                    </div>
                </div>

                <div className="course-hub-sections">
                    {sections.map((section) => (
                        <section key={section.title} className="course-hub-section">
                            <div className="course-hub-section-head">
                                <div>
                                    <p className="course-hub-section-kicker">{section.title}</p>
                                    <h2>{section.title}</h2>
                                    <p>{section.description}</p>
                                </div>
                            </div>

                            <div className="course-hub-grid">
                                {section.items.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className="course-hub-card"
                                        onClick={() => navigate(item.route)}
                                    >
                                        <div className="course-hub-card-top">
                                            <span className="course-hub-card-icon">
                                                {item.icon}
                                            </span>
                                            <span className="course-hub-card-status">
                                                {item.status}
                                            </span>
                                        </div>

                                        <h3>{item.title}</h3>
                                        <p>{item.subtitle}</p>

                                        <span className="course-hub-card-link">
                                            Open section
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
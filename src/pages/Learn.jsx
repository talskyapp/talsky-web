import { useMemo, useState } from "react";
import { useOutletContext, useNavigate, Navigate } from "react-router-dom";
import { API_URL } from "../lib/config";
import "../styles/Learn.css";

const courseCatalog = {
    Korean: {
        _id: "korean-course-id",
        flag: "🇰🇷",
        title: "Korean",
        description:
            "Build your Korean skills through guided lessons, vocabulary, pronunciation, and real-world practice.",
        learnPoints: [
            "Hangul and pronunciation",
            "Everyday vocabulary",
            "Basic grammar and sentence structure",
            "Real-life conversation practice",
        ],
    },
    Spanish: {
        _id: "spanish-course-id",
        flag: "🇪🇸",
        title: "Spanish",
        description:
            "Learn Spanish step by step with practical lessons, useful phrases, and conversation-focused practice.",
        learnPoints: [
            "Core vocabulary and pronunciation",
            "Everyday phrases",
            "Conversation foundations",
            "Grammar in context",
        ],
    },
    Italian: {
        _id: "italian-course-id",
        flag: "🇮🇹",
        title: "Italian",
        description:
            "Start learning Italian with structured modules, essential phrases, pronunciation, and guided practice.",
        learnPoints: [
            "Pronunciation essentials",
            "Travel and daily vocabulary",
            "Sentence building",
            "Listening and speaking practice",
        ],
    },
    Japanese: {
        _id: "japanese-course-id",
        flag: "🇯🇵",
        title: "Japanese",
        description:
            "Begin your Japanese journey with guided lessons covering pronunciation, writing systems, and useful expressions.",
        learnPoints: [
            "Hiragana and Katakana basics",
            "Useful vocabulary",
            "Basic grammar patterns",
            "Everyday communication",
        ],
    },
    English: {
        _id: "69c5c735161cb0a68a7a9e8a",
        flag: "🇺🇸",
        title: "English",
        description:
            "Improve your English through structured lessons, speaking practice, grammar, and real-world usage.",
        learnPoints: [
            "Speaking confidence",
            "Core grammar and vocabulary",
            "Listening practice",
            "Everyday communication",
        ],
    },
    Portuguese: {
        _id: "portuguese-course-id",
        flag: "🇧🇷",
        title: "Portuguese",
        description:
            "Learn Portuguese with guided modules focused on pronunciation, useful expressions, and conversation.",
        learnPoints: [
            "Pronunciation and rhythm",
            "Common vocabulary",
            "Basic communication",
            "Practical conversation",
        ],
    },
    French: {
        _id: "french-course-id",
        flag: "🇫🇷",
        title: "French",
        description:
            "Learn French through structured lessons, pronunciation guidance, and conversation-based practice.",
        learnPoints: [
            "Pronunciation basics",
            "Everyday expressions",
            "Sentence patterns",
            "Conversation skills",
        ],
    },
    German: {
        _id: "german-course-id",
        flag: "🇩🇪",
        title: "German",
        description:
            "Build German skills with guided lessons, essential vocabulary, grammar foundations, and speaking practice.",
        learnPoints: [
            "Core vocabulary",
            "Sentence structure",
            "Grammar basics",
            "Practical speaking",
        ],
    },
};

const fallbackCourse = {
    flag: "🌍",
    title: "Language Course",
    description:
        "Start learning with structured lessons, practical vocabulary, and guided speaking practice.",
    learnPoints: [
        "Core vocabulary",
        "Useful expressions",
        "Grammar foundations",
        "Conversation practice",
    ],
};

const normalizeLevel = (level) => {
    const value = String(level || "").trim().toLowerCase();

    if (value.includes("begin")) return "beginner";
    if (value.includes("inter")) return "intermediate";
    if (value.includes("adv")) return "advanced";

    return "beginner";
};

const normalizeGoal = (goal) => {
    const value = String(goal || "").trim().toLowerCase();

    if (value.includes("travel")) return "travel";
    if (value.includes("conversation")) return "conversation";
    if (value.includes("work")) return "work";
    if (value.includes("culture")) return "culture";

    return "conversation";
};

const formatLevelLabel = (level) => {
    const normalized = normalizeLevel(level);

    if (normalized === "beginner") return "Beginner";
    if (normalized === "intermediate") return "Intermediate";
    return "Advanced";
};

const formatGoalLabel = (goal) => {
    const normalized = normalizeGoal(goal);

    if (normalized === "travel") return "Travel";
    if (normalized === "conversation") return "Conversation";
    if (normalized === "work") return "Work";
    return "Culture";
};

const getRecommendedTrack = (level, goal) => {
    const normalizedLevel = normalizeLevel(level);
    const normalizedGoal = normalizeGoal(goal);

    if (normalizedLevel === "beginner") {
        return "Foundations Course";
    }

    if (normalizedLevel === "intermediate") {
        const intermediateTracks = {
            travel: "Travel Fluency",
            conversation: "Conversation Fluency",
            work: "Professional Fluency",
            culture: "Cultural Fluency",
        };

        return intermediateTracks[normalizedGoal] || "Fluency Course";
    }

    const advancedTracks = {
        travel: "Advanced Travel Communication",
        conversation: "Communication Mastery",
        work: "Professional Communication Mastery",
        culture: "Cultural Mastery",
    };

    return advancedTracks[normalizedGoal] || "Communication Mastery";
};

const getTrackSubtitle = (level, goal) => {
    const normalizedLevel = normalizeLevel(level);
    const normalizedGoal = normalizeGoal(goal);

    if (normalizedLevel === "beginner") {
        return "Build a strong base before moving into specialized communication.";
    }

    const subtitles = {
        travel: "Practice the language you need for trips, directions, hotels, and real situations abroad.",
        conversation:
            "Develop natural speaking flow for everyday conversations and social confidence.",
        work: "Strengthen professional language for meetings, collaboration, and career growth.",
        culture: "Explore the language through culture, media, traditions, and deeper meaning.",
    };

    return subtitles[normalizedGoal] || subtitles.conversation;
};

const getPreviewModules = (level, goal) => {
    const normalizedLevel = normalizeLevel(level);
    const normalizedGoal = normalizeGoal(goal);

    if (normalizedLevel === "beginner") {
        return ["Foundations", "Core Vocabulary", "Basic Conversations"];
    }

    if (normalizedLevel === "intermediate") {
        const intermediateModules = {
            travel: ["Travel Situations", "Directions & Booking", "Real Trip Conversations"],
            conversation: ["Natural Speaking", "Everyday Expressions", "Social Conversations"],
            work: ["Workplace Language", "Meetings & Emails", "Professional Speaking"],
            culture: ["Cultural Topics", "Traditions & Media", "Deeper Discussions"],
        };

        return intermediateModules[normalizedGoal] || intermediateModules.conversation;
    }

    const advancedModules = {
        travel: [
            "Fluent Travel Interaction",
            "Solving Problems Abroad",
            "Real-World Communication",
        ],
        conversation: [
            "Advanced Expression",
            "Nuance & Humor",
            "Mastering Natural Conversation",
        ],
        work: [
            "Leadership Communication",
            "Negotiation & Meetings",
            "Executive-Level Fluency",
        ],
        culture: ["Cultural Analysis", "Media & Society", "Complex Discussions"],
    };

    return advancedModules[normalizedGoal] || advancedModules.conversation;
};

const getLearnPoints = (basePoints, level, goal) => {
    const normalizedLevel = normalizeLevel(level);
    const normalizedGoal = normalizeGoal(goal);

    if (normalizedLevel === "beginner") {
        return basePoints;
    }

    const customPoints = {
        intermediate: {
            travel: [
                "Travel vocabulary and practical phrases",
                "Hotels, directions, and transportation",
                "Real trip conversation practice",
                "Confidence in common travel situations",
            ],
            conversation: [
                "Everyday speaking confidence",
                "Natural expressions and sentence flow",
                "Listening in real conversations",
                "Social conversation practice",
            ],
            work: [
                "Professional vocabulary",
                "Meetings and workplace communication",
                "Clear speaking in formal contexts",
                "Practical work-related conversations",
            ],
            culture: [
                "Culture-focused vocabulary",
                "Traditions, lifestyle, and media topics",
                "Understanding context and meaning",
                "Deeper cultural conversations",
            ],
        },
        advanced: {
            travel: [
                "Confident travel communication",
                "Handling unexpected situations abroad",
                "Understanding fast real-world speech",
                "Advanced practical speaking",
            ],
            conversation: [
                "Nuanced and natural expression",
                "Fluent discussion skills",
                "Better listening comprehension",
                "Advanced conversation mastery",
            ],
            work: [
                "Professional communication mastery",
                "High-level meetings and negotiation",
                "Clear and persuasive speaking",
                "Advanced workplace fluency",
            ],
            culture: [
                "Deep cultural understanding",
                "Media, ideas, and social themes",
                "Advanced interpretation and discussion",
                "Complex cultural communication",
            ],
        },
    };

    return customPoints[normalizedLevel]?.[normalizedGoal] || basePoints;
};

export default function Learn() {
    const { user, setUser } = useOutletContext();
    const navigate = useNavigate();
    const [starting, setStarting] = useState(false);

    const primaryLanguage = useMemo(() => {
        if (Array.isArray(user?.languageToLearn) && user.languageToLearn.length > 0) {
            return user.languageToLearn[0];
        }

        if (typeof user?.languageToLearn === "string" && user.languageToLearn.trim()) {
            return user.languageToLearn;
        }

        return null;
    }, [user]);

    const course = primaryLanguage
        ? courseCatalog[primaryLanguage] || {
            ...fallbackCourse,
            title: primaryLanguage,
        }
        : fallbackCourse;

    const userLevel = formatLevelLabel(user?.level || "Beginner");
    const userGoal = formatGoalLabel(user?.goal || "Conversation");

    const recommendedTrack = useMemo(
        () => getRecommendedTrack(userLevel, userGoal),
        [userLevel, userGoal]
    );

    const trackSubtitle = useMemo(
        () => getTrackSubtitle(userLevel, userGoal),
        [userLevel, userGoal]
    );

    const previewModules = useMemo(
        () => getPreviewModules(userLevel, userGoal),
        [userLevel, userGoal]
    );

    const dynamicLearnPoints = useMemo(
        () => getLearnPoints(course.learnPoints, userLevel, userGoal),
        [course.learnPoints, userLevel, userGoal]
    );

    const handleStartCourse = async () => {
        try {
            setStarting(true);
            console.log("LANG:", primaryLanguage);
            console.log("COURSE:", course);
            console.log("COURSE ID:", course?._id);
            const response = await fetch(`${API_URL}/api/users/activate-course/${user._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    activeLearningLanguage: course.title,
                    activeTrack: recommendedTrack,
                    activeGoal: userGoal,
                    activeLevel: userLevel,
                    activeCourseId: course._id,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to activate course");
            }

            const updatedUser = await response.json();
            setUser(updatedUser);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            navigate("/dashboard/learn/course");
        } catch (error) {
            console.error("Error starting course:", error);
            setStarting(false);
        }
    };

    if (user?.courseActivated && !starting) {
        return <Navigate to="/dashboard/learn/course" replace />;
    }

    return (
        <div className="learn-page">
            <div className="learn-hero-card">
                <div className="learn-hero-left">
                    <span className="learn-badge">Your active course</span>

                    <div className="learn-language-row">
                        <div className="learn-flag">{course.flag}</div>

                        <div className="learn-language-text">
                            <h1>Learn {course.title}</h1>
                            <p>{course.description}</p>
                        </div>
                    </div>

                    <div className="learn-meta-grid">
                        <div className="learn-meta-card">
                            <span className="learn-meta-label">Track</span>
                            <strong>{recommendedTrack}</strong>
                        </div>

                        <div className="learn-meta-card">
                            <span className="learn-meta-label">Your level</span>
                            <strong>{userLevel}</strong>
                        </div>

                        <div className="learn-meta-card">
                            <span className="learn-meta-label">Main goal</span>
                            <strong>{userGoal}</strong>
                        </div>
                    </div>

                    <div className="learn-section">
                        <h2>What you’ll learn</h2>
                        <p className="learn-track-subtitle">{trackSubtitle}</p>

                        <div className="learn-points">
                            {dynamicLearnPoints.map((point) => (
                                <div key={point} className="learn-point">
                                    <span className="learn-point-icon">✓</span>
                                    <span>{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="learn-actions">

                        <button
                            className="learn-start-btn"
                            onClick={handleStartCourse}
                            disabled={starting}
                            type="button"

                        >
                            {starting ? "Preparing your course..." : "Start Course"}
                        </button>

                        <button
                            className="learn-secondary-btn"
                            type="button"
                            onClick={() => navigate("/dashboard/profile")}
                        >
                            View profile
                        </button>
                    </div>
                </div>

                <div className="learn-hero-right">
                    <div className="learn-visual-card">
                        <div className="learn-big-flag">{course.flag}</div>
                        <h3>{course.title}</h3>
                        <p>{recommendedTrack}</p>

                        {starting ? (
                            <div className="learn-loading-box">
                                <div className="learn-spinner" />
                                <span>Loading your first module.</span>
                            </div>
                        ) : (
                            <div className="learn-preview-stack">
                                <span className="learn-preview-title">Modules you'll learn</span>

                                {previewModules.map((module) => (
                                    <div key={module} className="learn-preview-item">
                                        <span className="learn-preview-icon">✓</span>
                                        <span className="learn-preview-text">{module}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, Navigate } from "react-router-dom";
import { API_URL } from "../lib/config";
import "../styles/Course.css";

export default function Course() {
    const navigate = useNavigate();
    const { user } = useOutletContext();

    const [courseData, setCourseData] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedCompletedTopic, setSelectedCompletedTopic] = useState(null);
    const [showLessonActionModal, setShowLessonActionModal] = useState(false);
    const [moduleTestProgressData, setModuleTestProgressData] = useState([]);

    const [selectedCompletedModuleTest, setSelectedCompletedModuleTest] = useState(null);
    const [showModuleTestActionModal, setShowModuleTestActionModal] = useState(false);

    const activeLanguage =
        user?.activeLearningLanguage || user?.languageToLearn?.[0] || "Japanese";

    const getFlag = (lang) => {
        const flags = {
            japanese: "🇯🇵",
            spanish: "🇪🇸",
            english: "🇺🇸",
            korean: "🇰🇷",
            italian: "🇮🇹",
            french: "🇫🇷",
            german: "🇩🇪",
            portuguese: "🇵🇹",
        };

        return flags[String(lang || "").toLowerCase()] || "🌍";
    };

    const getScoreTone = (score) => {
        if (score >= 100) return "excellent";
        if (score >= 60) return "good";
        if (score > 0) return "mid";
        return "low";
    };

    const circleStyle = (score) => ({
        background: `conic-gradient(var(--ring-color) ${Math.max(
            0,
            Math.min(score, 100)
        ) * 3.6}deg, #eceff5 0deg)`,
    });

    useEffect(() => {
        const fetchAll = async () => {
            try {
                if (!user?.activeCourseId || !user?._id) {
                    setLoading(false);
                    return;
                }

                setLoading(true);

                const [courseRes, progressRes, moduleTestProgressRes] = await Promise.all([
                    fetch(`${API_URL}/api/courses/${user.activeCourseId}/full`),
                    fetch(
                        `${API_URL}/api/progress/course/${user.activeCourseId}/${user._id}`
                    ),
                    fetch(
                        `${API_URL}/api/module-test-progress/course/${user.activeCourseId}/${user._id}`
                    ),
                ]);

                if (!courseRes.ok) {
                    throw new Error("Failed to load course");
                }

                if (!progressRes.ok) {
                    throw new Error("Failed to load progress");
                }

                if (!moduleTestProgressRes.ok) {
                    throw new Error("Failed to load module test progress");
                }

                const courseJson = await courseRes.json();
                const progressJson = await progressRes.json();
                const moduleTestProgressJson = await moduleTestProgressRes.json();

                setCourseData(courseJson);
                setProgressData(Array.isArray(progressJson) ? progressJson : []);
                setModuleTestProgressData(Array.isArray(moduleTestProgressJson) ? moduleTestProgressJson : []);
            } catch (error) {
                console.error("Error loading course page:", error);
                setCourseData(null);
                setProgressData([]);
                setModuleTestProgressData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [user?.activeCourseId, user?._id]);

    const safeCourseData = useMemo(() => {
        if (!courseData) {
            return {
                title: `${activeLanguage} Course`,
                subtitle: "Build your learning path module by module",
                totalProgress: 0,
                totalModules: 0,
                totalTopics: 0,
                modules: [],
            };
        }

        const modules = Array.isArray(courseData.modules) ? courseData.modules : [];
        const progressMap = new Map(
            progressData.map((item) => [String(item.lessonId), item])
        );

        const moduleTestProgressMap = new Map(
            moduleTestProgressData.map((item) => [String(item.moduleTestId), item])
        );

        let totalLessonsCount = 0;
        let totalProgressSum = 0;

        const mappedModules = modules.map((module, moduleIndex) => {
            const lessons = Array.isArray(module.lessons) ? module.lessons : [];

            const mappedTopics = lessons.map((lesson, lessonIndex) => {
                const progress = progressMap.get(String(lesson._id));

                let lessonPercent = 0;

                if (progress?.completed) {
                    lessonPercent = 100;
                } else if (typeof progress?.bestScore === "number" && progress.bestScore > 0) {
                    lessonPercent = progress.bestScore;
                } else if (typeof progress?.lastScore === "number" && progress.lastScore > 0) {
                    lessonPercent = progress.lastScore;
                }

                totalLessonsCount += 1;
                totalProgressSum += lessonPercent;

                return {
                    id: lesson._id,
                    lessonId: lesson._id,
                    title: lesson.title || `Lesson ${lessonIndex + 1}`,
                    estimatedMinutes: lesson.estimatedMinutes || 5,
                    progress: lessonPercent,
                    completed: !!progress?.completed,
                    currentStepIndex: 0,
                    bestScore: progress?.bestScore ?? 0,
                    lastScore: progress?.lastScore ?? 0,
                    attemptsCount: progress?.attemptsCount ?? 0,
                    image:
                        lesson.image ||
                        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
                    order: lesson.order || lessonIndex + 1,
                };
            });

            const moduleProgress =
                mappedTopics.length > 0
                    ? Math.round(
                        mappedTopics.reduce((acc, topic) => acc + topic.progress, 0) /
                        mappedTopics.length
                    )
                    : 0;

            const allLessonsCompleted =
                mappedTopics.length > 0 && mappedTopics.every((topic) => topic.completed);

            const moduleTestProgress = module.moduleTestId
                ? moduleTestProgressMap.get(String(module.moduleTestId))
                : null;

            const moduleTestPercent = Math.max(
                Number(moduleTestProgress?.bestScore || 0),
                Number(moduleTestProgress?.lastScore || 0)
            );

            return {
                id: module._id,
                title: `Module ${moduleIndex + 1}`,
                name: module.name || `Module ${moduleIndex + 1}`,
                progress: moduleProgress,
                topics: mappedTopics,
                hasTest: !!module.hasTest,
                moduleTestId: module.moduleTestId || "",
                testUnlocked: allLessonsCompleted,
                testTitle: module.name
                    ? `${module.name} Test`
                    : `Module ${moduleIndex + 1} Test`,

                testProgress: moduleTestPercent,
                testCompleted: !!moduleTestProgress?.completed,
                testPassed: !!moduleTestProgress?.passed,
                testAttemptsCount: moduleTestProgress?.attemptsCount ?? 0,
            };
        });

        const totalTopics = mappedModules.reduce(
            (acc, module) => acc + module.topics.length,
            0
        );

        const totalProgress =
            totalLessonsCount > 0 ? Math.round(totalProgressSum / totalLessonsCount) : 0;

        return {
            title: courseData.name || `${activeLanguage} Course`,
            subtitle:
                courseData.description || "Build your learning path module by module",
            totalProgress,
            totalModules: mappedModules.length,
            totalTopics,
            modules: mappedModules,
        };
    }, [courseData, progressData, moduleTestProgressData, activeLanguage]);

    const unlockedLessonIds = useMemo(() => {
        const allLessons = safeCourseData.modules.flatMap((module) => module.topics);

        if (!allLessons.length) return new Set();

        const unlocked = new Set();
        unlocked.add(String(allLessons[0].lessonId));

        for (let i = 0; i < allLessons.length; i += 1) {
            const current = allLessons[i];
            const next = allLessons[i + 1];

            if (current?.completed && next) {
                unlocked.add(String(next.lessonId));
            }

            if (current?.progress > 0) {
                unlocked.add(String(current.lessonId));
            }
        }

        return unlocked;
    }, [safeCourseData]);

    const handleOpenLesson = (topic) => {
        const isUnlocked = unlockedLessonIds.has(String(topic.lessonId));
        if (!isUnlocked) return;

        if (topic.completed) {
            setSelectedCompletedTopic(topic);
            setShowLessonActionModal(true);
            return;
        }

        navigate(`/dashboard/learn/lesson/${topic.lessonId}`);
    };

    const handleRestartLesson = () => {
        if (!selectedCompletedTopic) return;

        setShowLessonActionModal(false);
        navigate(`/dashboard/learn/lesson/${selectedCompletedTopic.lessonId}`);
    };

    const handleReviewSkills = () => {
        if (!selectedCompletedTopic) return;

        setShowLessonActionModal(false);
        navigate(`/dashboard/learn/lesson/${selectedCompletedTopic.lessonId}?mode=review`);
    };

    const handleOpenModuleTest = (module) => {
        if (!module?.hasTest || !module?.moduleTestId) return;
        if (!module?.testUnlocked) return;

        if (module.testCompleted) {
            setSelectedCompletedModuleTest(module);
            setShowModuleTestActionModal(true);
            return;
        }

        navigate(`/dashboard/learn/module-test/${module.moduleTestId}`);
    };

    const handleRetakeModuleTest = () => {
        if (!selectedCompletedModuleTest) return;

        setShowModuleTestActionModal(false);
        navigate(`/dashboard/learn/module-test/${selectedCompletedModuleTest.moduleTestId}`);
    };

    const handleReviewModuleTest = () => {
        if (!selectedCompletedModuleTest) return;

        setShowModuleTestActionModal(false);
        navigate(
            `/dashboard/learn/module-test/${selectedCompletedModuleTest.moduleTestId}?mode=review`
        );
    };

    if (!user?.courseActivated) {
        return <Navigate to="/dashboard/learn" replace />;
    }

    if (loading) {
        return (
            <div className="course-page">
                <div className="course-shell">
                    <div className="course-loading">Loading course...</div>
                </div>
            </div>
        );
    }

    if (!user?.activeCourseId) {
        return (
            <div className="course-page">
                <div className="course-shell">
                    <div className="course-empty">No active course selected yet.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="course-page">
            <div className="course-shell">
                <div className="course-hero">
                    <div className="course-hero-left">
                        <p className="course-kicker">Your course</p>

                        <div className="course-title-row">
                            <div className="course-flag">{getFlag(activeLanguage)}</div>

                            <div>
                                <h1>{safeCourseData.title}</h1>
                                <p className="course-subtitle">{safeCourseData.subtitle}</p>
                            </div>
                        </div>

                        <div className="course-meta">
                            <span className="course-pill">
                                {safeCourseData.totalModules} modules
                            </span>
                            <span className="course-pill">
                                {safeCourseData.totalTopics} topics
                            </span>
                            <span className="course-pill">
                                {safeCourseData.totalProgress}% total progress
                            </span>
                        </div>
                    </div>

                    <div className="course-hero-right">
                        <button
                            className="course-hub-btn"
                            type="button"
                            onClick={() => navigate("/dashboard/course-hub")}
                            aria-label="Open Course Hub"
                            title="Open Course Hub"
                        >
                            <span className="course-hub-btn-icon">◫</span>
                            <span>Course Hub</span>
                        </button>
                    </div>
                </div>

                <div className="course-section-head">
                    <div>
                        <p className="course-section-kicker">Course roadmap</p>
                        <h2>Modules and topics</h2>
                    </div>
                </div>

                <div className="course-roadmap">
                    {safeCourseData.modules.map((module, moduleIndex) => (
                        <section key={module.id} className="course-module-block">
                            <div className="course-module-header">
                                <div className="course-module-title-wrap">
                                    <span className="course-module-label">{module.title}</span>
                                    <h3>{module.name}</h3>
                                </div>

                                <div className="module-progress-chip">
                                    {module.progress}% module progress
                                </div>
                            </div>

                            <div className="course-topic-list">
                                {module.topics.map((topic, topicIndex) => {
                                    const tone = getScoreTone(topic.progress);
                                    const isUnlocked = unlockedLessonIds.has(
                                        String(topic.lessonId)
                                    );

                                    const showConnector =
                                        topicIndex !== module.topics.length - 1 || module.hasTest;

                                    return (
                                        <div
                                            key={topic.id}
                                            className={`course-topic-row ${isUnlocked ? "clickable" : "locked"
                                                }`}
                                            onClick={() => handleOpenLesson(topic)}
                                        >
                                            <div className="course-topic-left">
                                                <div
                                                    className={`topic-score-ring ${tone}`}
                                                    style={circleStyle(topic.progress)}
                                                >
                                                    <div className="topic-score-inner">
                                                        <span>
                                                            {topic.completed
                                                                ? "✓"
                                                                : `${topic.progress}%`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {showConnector && (
                                                    <div className="topic-connector-line" />
                                                )}
                                            </div>

                                            <div className="course-topic-card lesson-topic-card">
                                                <img
                                                    src={topic.image}
                                                    alt={topic.title}
                                                    className="course-topic-image"
                                                />

                                                <div className="course-topic-content">
                                                    <div className="course-topic-top">
                                                        <span className="topic-small-label">
                                                            Topic {topicIndex + 1}
                                                        </span>

                                                        <div className="topic-badge-group">
                                                            {!isUnlocked && (
                                                                <span className="topic-lock-badge">
                                                                    Locked
                                                                </span>
                                                            )}

                                                            <span
                                                                className={`topic-score-badge ${tone}`}
                                                            >
                                                                {topic.completed
                                                                    ? "Completed"
                                                                    : topic.progress > 0
                                                                        ? `${topic.progress}%`
                                                                        : "Not started"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <h4>{topic.title}</h4>

                                                    <p>
                                                        {topic.completed
                                                            ? "You completed this lesson."
                                                            : isUnlocked
                                                                ? `Estimated time: ${topic.estimatedMinutes} min`
                                                                : "Complete the previous lesson to unlock this one."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {module.hasTest && (
                                    <div
                                        className={`course-topic-row ${module.testUnlocked ? "clickable" : "locked"
                                            }`}
                                        onClick={() => handleOpenModuleTest(module)}
                                    >
                                        <div className="course-topic-left">
                                            <div
                                                className={`topic-score-ring ${module.testUnlocked ? "good" : "low"
                                                    }`}
                                                style={circleStyle(module.testUnlocked ? module.testProgress || 0 : 0)}
                                            >
                                                <div className="topic-score-inner">
                                                    <span>📝</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="course-topic-card module-test-card">
                                            <img
                                                src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
                                                alt="Module Test"
                                                className="course-topic-image"
                                            />

                                            <div className="course-topic-content">
                                                <div className="course-topic-top">
                                                    <span className="topic-small-label">
                                                        Final Exam
                                                    </span>

                                                    <div className="topic-badge-group">
                                                        {!module.testUnlocked && (
                                                            <span className="topic-lock-badge">
                                                                Locked
                                                            </span>
                                                        )}

                                                        <span
                                                            className={`topic-score-badge ${!module.testUnlocked
                                                                ? "low"
                                                                : module.testCompleted
                                                                    ? "excellent"
                                                                    : module.testProgress >= 60
                                                                        ? "good"
                                                                        : module.testProgress > 0
                                                                            ? "mid"
                                                                            : "good"
                                                                }`}
                                                        >
                                                            {!module.testUnlocked
                                                                ? "Locked"
                                                                : module.testCompleted
                                                                    ? "Completed"
                                                                    : module.testProgress > 0
                                                                        ? `${module.testProgress}%`
                                                                        : "Ready"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h4>{module.testTitle}</h4>

                                                <p>
                                                    {!module.testUnlocked
                                                        ? "Finish all lessons to unlock the exam."
                                                        : module.testCompleted
                                                            ? `You passed this exam (${module.testProgress}%)`
                                                            : module.testProgress > 0
                                                                ? `Continue your exam (${module.testProgress}%)`
                                                                : "Take the final exam for this module."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            {showLessonActionModal && selectedCompletedTopic && (
                <div
                    className="lesson-action-overlay"
                    onClick={() => {
                        setShowLessonActionModal(false);
                        setSelectedCompletedTopic(null);
                    }}
                >
                    <div
                        className="lesson-action-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="lesson-action-kicker">Lesson completed</p>
                        <h3>{selectedCompletedTopic.title}</h3>
                        <p>Choose what you want to do next with this lesson.</p>

                        <div className="lesson-action-stats">
                            <div className="lesson-action-stat">
                                <span>Best score</span>
                                <strong>
                                    {selectedCompletedTopic.bestScore ||
                                        selectedCompletedTopic.progress ||
                                        0}
                                    %
                                </strong>
                            </div>

                            <div className="lesson-action-stat">
                                <span>Attempts</span>
                                <strong>{selectedCompletedTopic.attemptsCount || 0}</strong>
                            </div>
                        </div>

                        <div className="lesson-action-buttons">
                            <button
                                className="lesson-secondary-btn"
                                type="button"
                                onClick={handleReviewSkills}
                            >
                                Review skills
                            </button>

                            <button
                                className="lesson-primary-btn"
                                type="button"
                                onClick={handleRestartLesson}
                            >
                                Restart lesson
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showModuleTestActionModal && selectedCompletedModuleTest && (
                <div
                    className="lesson-action-overlay"
                    onClick={() => {
                        setShowModuleTestActionModal(false);
                        setSelectedCompletedModuleTest(null);
                    }}
                >
                    <div
                        className="lesson-action-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="lesson-action-kicker">Module test completed</p>
                        <h3>{selectedCompletedModuleTest.testTitle}</h3>
                        <p>
                            Choose what you want to do next with this exam.
                        </p>

                        <div className="lesson-action-stats">
                            <div className="lesson-action-stat">
                                <span>Best score</span>
                                <strong>{selectedCompletedModuleTest.testProgress || 0}%</strong>
                            </div>

                            <div className="lesson-action-stat">
                                <span>Attempts</span>
                                <strong>{selectedCompletedModuleTest.testAttemptsCount || 0}</strong>
                            </div>
                        </div>

                        <div className="lesson-action-buttons">
                            <button
                                className="lesson-secondary-btn"
                                type="button"
                                onClick={handleReviewModuleTest}
                            >
                                Review exam
                            </button>

                            <button
                                className="lesson-primary-btn"
                                type="button"
                                onClick={handleRetakeModuleTest}
                            >
                                Retake exam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
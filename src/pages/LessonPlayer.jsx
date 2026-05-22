import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { API_URL } from "../lib/config";
import confetti from "canvas-confetti";
import "../styles/LessonPlayer.css";

const resolveMediaUrl = (value) => {
    if (!value) return "";
    if (typeof value !== "string") return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_URL}${value}`;
};

const normalizeText = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, " ");

const isAnswerAccepted = (value, mainAnswer, acceptableAnswers = []) => {
    const normalizedUser = normalizeText(value);
    const accepted = [mainAnswer, ...(acceptableAnswers || [])]
        .map((item) => normalizeText(item))
        .filter(Boolean);

    return accepted.includes(normalizedUser);
};

const shuffleArray = (items = []) => {
    const clone = [...items];
    for (let i = clone.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
};

const playFeedbackSound = (type) => {
    try {
        const soundMap = {
            correct: "/sounds/correct.mp3",
            wrong: "/sounds/wrong.mp3",
            xp: "/sounds/xp.mp3",
        };

        const src = soundMap[type];
        if (!src) return;

        const audio = new Audio(src);
        audio.volume = type === "xp" ? 0.45 : 0.35;
        audio.play().catch(() => { });
    } catch (error) {
        console.error("Sound playback failed:", error);
    }
};

function useAnswerFeedback(checked, isCorrect) {
    useEffect(() => {
        if (!checked) return;

        if (isCorrect) {
            playFeedbackSound("correct");
            navigator.vibrate?.(50);
        } else {
            playFeedbackSound("wrong");
            navigator.vibrate?.([60, 40, 60]);
        }
    }, [checked, isCorrect]);
}

function InlineAnswerReaction({ checked, isCorrect }) {
    if (!checked) return null;

    return (
        <motion.div
            className={`lesson-answer-reaction ${isCorrect ? "correct" : "wrong"}`}
            initial={isCorrect ? { scale: 0.6, opacity: 0 } : { x: 0, opacity: 0 }}
            animate={
                isCorrect
                    ? { scale: [0.6, 1.18, 1], opacity: 1 }
                    : { x: [0, -10, 10, -6, 6, 0], opacity: 1 }
            }
            transition={
                isCorrect
                    ? { duration: 0.45, ease: "easeOut" }
                    : { duration: 0.38, ease: "easeOut" }
            }
        >
            <span>{isCorrect ? "✔" : "✕"}</span>
        </motion.div>
    );
}

function XPBurst({ xp = 0 }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let frameId;
        let start;

        const duration = 1100;
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        playFeedbackSound("xp");

        const tick = (timestamp) => {
            if (!start) start = timestamp;

            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            setCount(Math.round(xp * eased));

            if (progress < 1) {
                frameId = requestAnimationFrame(tick);
            }
        };

        frameId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frameId);
    }, [xp]);

    return (
        <div className="lesson-xp-burst">
            {[...Array(14)].map((_, index) => {
                const angle = (index / 14) * Math.PI * 2;
                const radius = 42 + (index % 4) * 8;

                return (
                    <motion.span
                        key={index}
                        className="lesson-xp-particle"
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{
                            x: Math.cos(angle) * radius,
                            y: Math.sin(angle) * radius,
                            scale: [0, 1, 0.2],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 0.85,
                            ease: "easeOut",
                            delay: 0.08 + index * 0.015,
                        }}
                    />
                );
            })}

            <motion.div
                className="lesson-xp-number"
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                +{count} XP
            </motion.div>
        </div>
    );
}

const extractRelatedData = (step, fallbackCorrectAnswer = "") => {
    if (!step) {
        return {
            relatedWord: String(fallbackCorrectAnswer || "").trim(),
            relatedVocabularyId: "",
        };
    }

    let relatedWord = "";
    let relatedVocabularyId = "";

    switch (step.type) {
        case "multiple-choice":
        case "listening":
        case "image-choice":
        case "translate-short-answer":
        case "listening-type":
            relatedWord = step.answer || fallbackCorrectAnswer || "";
            break;

        case "fill-in-the-blank":
        case "letter-bank":
        case "unscramble":
            relatedWord = step.answer || fallbackCorrectAnswer || "";
            break;

        case "speaking":
            relatedWord = step.targetText || step.answer || fallbackCorrectAnswer || "";
            break;

        case "match-pairs":
            relatedWord = fallbackCorrectAnswer || "";
            break;

        default:
            relatedWord = fallbackCorrectAnswer || "";
            break;
    }

    if (step.vocabularyId) {
        relatedVocabularyId = step.vocabularyId;
    }

    return {
        relatedWord: String(relatedWord || "").trim(),
        relatedVocabularyId: String(relatedVocabularyId || "").trim(),
    };
};

export default function LessonPlayer() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useOutletContext();

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showExitModal, setShowExitModal] = useState(false);

    const [sessionAnswers, setSessionAnswers] = useState([]);
    const [lessonResult, setLessonResult] = useState(null);
    const [submittingResult, setSubmittingResult] = useState(false);

    const [showStreakReward, setShowStreakReward] = useState(false);
    const [liveStreak, setLiveStreak] = useState(user?.streak || 0);
    const [pendingStreakValue, setPendingStreakValue] = useState(null);
    const lessonCardRef = useRef(null);
    const lessonPageRef = useRef(null);


    useEffect(() => {
        lessonCardRef.current?.scrollTo({
            top: 0,
            behavior: "auto",
        });

        lessonPageRef.current?.scrollTo({
            top: 0,
            behavior: "auto",
        });

        window.scrollTo({
            top: 0,
            behavior: "auto",
        });
    }, [currentStepIndex]);

    useEffect(() => {
        setLiveStreak(user?.streak || 0);
    }, [user?.streak]);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                setLoading(true);

                const res = await fetch(`${API_URL}/api/lessons/${lessonId}`)

                if (!res.ok) {
                    throw new Error("Failed to load lesson");
                }

                const data = await res.json();
                setLesson(data);
            } catch (error) {
                console.error("Error loading lesson:", error);
                setLesson(null);
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    const steps = useMemo(() => {
        return Array.isArray(lesson?.steps) ? lesson.steps : [];
    }, [lesson]);

    const currentStep = steps[currentStepIndex];

    const recordAnswer = ({
        stepIndex,
        stepType,
        prompt = "",
        userAnswer = "",
        correctAnswer = "",
        isCorrect = false,
        relatedWord = "",
        relatedVocabularyId = "",
        xpEarned = 0,
    }) => {
        setSessionAnswers((prev) => {
            const filtered = prev.filter((item) => item.stepIndex !== stepIndex);

            return [
                ...filtered,
                {
                    stepIndex,
                    stepType,
                    prompt,
                    userAnswer,
                    correctAnswer,
                    isCorrect,
                    relatedWord,
                    relatedVocabularyId,
                    xpEarned,
                },
            ];
        });
    };

    const goNext = async () => {
        const nextIndex = currentStepIndex + 1;

        if (nextIndex < steps.length) {
            setCurrentStepIndex(nextIndex);
            return;
        }

        try {
            setSubmittingResult(true);

            const totalQuestions = sessionAnswers.length;
            const correctAnswers = sessionAnswers.filter((a) => a.isCorrect).length;
            const wrongAnswers = totalQuestions - correctAnswers;

            const res = await fetch(`${API_URL}/api/lesson-attempts/complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user._id,
                    courseId: user.activeCourseId,
                    moduleId: lesson.moduleId,
                    lessonId: lesson._id,
                    mode: "normal",
                    totalQuestions,
                    correctAnswers,
                    wrongAnswers,
                    passThreshold: 70,
                    answers: sessionAnswers,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit lesson result");
            }

            const data = await res.json();
            setLessonResult(data.result);
        } catch (error) {
            console.error("Error submitting lesson:", error);
        } finally {
            setSubmittingResult(false);
        }
    };

    const handleExitLesson = () => {
        navigate("/dashboard/learn/course");
    };

    const handleRetryLesson = () => {
        setLessonResult(null);
        setShowStreakReward(false);
        setPendingStreakValue(null);
        setCurrentStepIndex(0);
        setSessionAnswers([]);
    };

    const handleContinueFromResult = () => {
        if (lessonResult?.passed) {
            const nextStreakValue =
                typeof lessonResult?.streak?.streakCount === "number"
                    ? lessonResult.streak.streakCount
                    : liveStreak + 1;

            setPendingStreakValue(nextStreakValue);
            setLessonResult(null);
            setShowStreakReward(true);
            return;
        }

        navigate("/dashboard/learn/course");
    };

    const handleStreakComplete = () => {
        setShowStreakReward(false);
        setPendingStreakValue(null);
        navigate("/dashboard/learn/course");
    };

    if (loading) {
        return (
            <div className="lesson-player-page">
                <div className="lesson-player-card">Loading lesson...</div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="lesson-player-page">
                <div className="lesson-player-card">Lesson not found.</div>
            </div>
        );
    }

    if (!steps.length) {
        return (
            <div className="lesson-player-page">
                <div className="lesson-player-card">
                    <p className="lesson-kicker">Lesson · {lesson.title}</p>
                    <p>This lesson has no steps yet.</p>

                    <div className="lesson-actions lesson-actions-end">
                        <button
                            className="lesson-primary-btn"
                            onClick={() => navigate("/dashboard/learn/course")}
                            type="button"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="lesson-player-page" ref={lessonPageRef}>
            <div className="lesson-player-shell">
                <div className="lesson-player-header">
                    <button
                        className="lesson-back-btn"
                        onClick={() => setShowExitModal(true)}
                        type="button"
                    >
                        Exit
                    </button>

                    <div className="lesson-progress-wrap">
                        <div
                            className="lesson-progress-bar"
                            style={{
                                width: `${steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0}%`,
                            }}
                        />
                    </div>

                    <span className="lesson-step-counter">
                        {currentStepIndex + 1} / {steps.length}
                    </span>
                </div>

                <div className="lesson-player-card" ref={lessonCardRef}>
                    <p className="lesson-kicker">Lesson · {lesson.title}</p>

                    {currentStep?.type === "intro" && (
                        <IntroStep
                            step={currentStep}
                            onNext={goNext}
                            isLast={currentStepIndex === steps.length - 1}
                        />
                    )}

                    {currentStep?.type === "theory" && (
                        <TheoryStep
                            step={currentStep}
                            onNext={goNext}
                            isLast={currentStepIndex === steps.length - 1}
                        />
                    )}

                    {currentStep?.type === "vocabulary" && (
                        <VocabularyFocusStep
                            step={currentStep}
                            onNext={goNext}
                            isLast={currentStepIndex === steps.length - 1}
                        />
                    )}

                    {currentStep?.type === "multiple-choice" && (
                        <MultipleChoiceStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "listening" && (
                        <ListeningStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "speaking" && (
                        <SpeakingStep
                            step={currentStep}
                            onNext={goNext}
                            isLast={currentStepIndex === steps.length - 1}
                        />
                    )}

                    {currentStep?.type === "conversation" && (
                        <ConversationStep
                            step={currentStep}
                            onNext={goNext}
                            isLast={currentStepIndex === steps.length - 1}
                        />
                    )}

                    {currentStep?.type === "fill-in-the-blank" && (
                        <FillInTheBlankStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "translate-short-answer" && (
                        <TranslateShortAnswerStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "listening-type" && (
                        <ListeningTypeStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "letter-bank" && (
                        <LetterBankStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "unscramble" && (
                        <UnscrambleStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "match-pairs" && (
                        <MatchPairsStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {currentStep?.type === "image-choice" && (
                        <ImageChoiceStep
                            step={currentStep}
                            stepIndex={currentStepIndex}
                            onNext={goNext}
                            onRecordAnswer={recordAnswer}
                        />
                    )}

                    {![
                        "intro",
                        "theory",
                        "vocabulary",
                        "multiple-choice",
                        "listening",
                        "speaking",
                        "conversation",
                        "fill-in-the-blank",
                        "translate-short-answer",
                        "listening-type",
                        "letter-bank",
                        "unscramble",
                        "match-pairs",
                        "image-choice",
                    ].includes(currentStep?.type) && (
                            <DefaultStep
                                step={currentStep}
                                onNext={goNext}
                                isLast={currentStepIndex === steps.length - 1}
                            />
                        )}
                </div>
            </div>

            {showExitModal && (
                <div className="lesson-exit-overlay">
                    <div className="lesson-exit-modal">
                        <h3>Leave lesson?</h3>
                        <p>
                            Are you sure you want to leave this lesson? Your progress will not be saved.
                        </p>

                        <div className="lesson-exit-actions">
                            <button
                                className="lesson-secondary-btn"
                                type="button"
                                onClick={() => setShowExitModal(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="lesson-primary-btn"
                                type="button"
                                onClick={handleExitLesson}
                            >
                                Exit lesson
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {submittingResult && (
                <div className="lesson-result-overlay">
                    <div className="lesson-result-card">
                        <h2>Saving your result...</h2>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {lessonResult && !showStreakReward && (
                    <LessonResultScreen
                        result={lessonResult}
                        onRetry={handleRetryLesson}
                        onExit={handleContinueFromResult}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showStreakReward && pendingStreakValue !== null && (
                    <StreakRewardOverlay
                        key={`streak-${pendingStreakValue}`}
                        streakValue={pendingStreakValue}
                        onArrive={() => {
                            setLiveStreak(pendingStreakValue);

                            window.dispatchEvent(
                                new CustomEvent("lesson-streak-earned", {
                                    detail: { nextStreak: pendingStreakValue },
                                })
                            );
                        }}
                        onComplete={handleStreakComplete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function StepActions({ onNext, isLast, disabled = false }) {
    return (
        <div className="lesson-actions lesson-actions-end">
            <button
                className="lesson-primary-btn"
                onClick={onNext}
                type="button"
                disabled={disabled}
            >
                {isLast ? "Finish" : "Continue"}
            </button>
        </div>
    );
}

function IntroStep({ step, onNext, isLast }) {
    return (
        <div className="lesson-step-content">
            <div className="lesson-intro-box">
                <span className="lesson-intro-badge">Start speaking</span>
                <h1>{step.content?.headline || "Welcome"}</h1>
                <p>{step.content?.text}</p>
            </div>

            <StepActions onNext={onNext} isLast={isLast} />
        </div>
    );
}

function TheoryStep({ step, onNext, isLast }) {
    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Mini Theory"}</h2>
            <p className="lesson-theory-text">
                {(step.content?.text || "").replace(/\\n/g, "\n")}
            </p>

            <StepActions onNext={onNext} isLast={isLast} />
        </div>
    );
}

function VocabularyFocusStep({ step, onNext, isLast }) {
    const items = step.items || [];
    const [activeIndex, setActiveIndex] = useState(0);
    const [savedWords, setSavedWords] = useState({});
    const [showUsageNote, setShowUsageNote] = useState(false);

    const activeItem = items[activeIndex];

    useEffect(() => {
        setActiveIndex(0);
        setShowUsageNote(false);
    }, [step]);

    useEffect(() => {
        setShowUsageNote(false);
    }, [activeIndex]);

    const toggleSaveWord = () => {
        setSavedWords((prev) => ({
            ...prev,
            [activeIndex]: !prev[activeIndex],
        }));
    };

    const goPrevWord = () => {
        if (activeIndex > 0) {
            setActiveIndex((prev) => prev - 1);
        }
    };

    const goNextWord = () => {
        if (activeIndex < items.length - 1) {
            setActiveIndex((prev) => prev + 1);
        }
    };

    if (!activeItem) {
        return (
            <div className="lesson-step-content">
                <h2>Vocabulary</h2>
                <p>No vocabulary items yet.</p>

                <StepActions onNext={onNext} isLast={isLast} />
            </div>
        );
    }

    const imageSrc = resolveMediaUrl(activeItem.image);
    const audioSrc = resolveMediaUrl(activeItem.audio);
    const isSaved = !!savedWords[activeIndex];
    const hasReviewedAllWords = activeIndex === items.length - 1;

    return (
        <div className="lesson-step-content">
            <div className="lesson-vocab-focus-header">
                <p className="lesson-kicker">Vocabulary</p>
                <h2>Key words for this lesson</h2>
                <p className="lesson-step-subtext">
                    Learn the meaning, pronunciation, and usage of each expression.
                </p>
            </div>

            <div className="lesson-vocab-focus-card">
                <div className="lesson-vocab-focus-top">
                    <span className="lesson-vocab-focus-number">
                        {String(activeIndex + 1).padStart(2, "0")}
                    </span>

                    <span className="lesson-vocab-focus-counter">
                        {activeIndex + 1} / {items.length}
                    </span>
                </div>

                <div className="lesson-vocab-focus-main">
                    <div className="lesson-vocab-focus-left">
                        <div className="lesson-vocab-word-row">
                            <div className="lesson-vocab-word-left">
                                <h3>{activeItem.text}</h3>

                                <button
                                    className={`lesson-bookmark-btn ${isSaved ? "active" : ""}`}
                                    onClick={toggleSaveWord}
                                    type="button"
                                    aria-label={isSaved ? "Remove saved word" : "Save word"}
                                    title={isSaved ? "Saved" : "Save word"}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill={isSaved ? "#7c3aed" : "none"}
                                        stroke="#7c3aed"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M6 4h12a2 2 0 0 1 2 2v16l-8-5-8 5V6a2 2 0 0 1 2-2z" />
                                    </svg>
                                </button>

                                {activeItem.note && (
                                    <div className="lesson-usage-wrap">
                                        <button
                                            className={`lesson-usage-btn ${showUsageNote ? "active" : ""}`}
                                            onClick={() => setShowUsageNote((prev) => !prev)}
                                            type="button"
                                            aria-label="Show usage note"
                                            title="Usage note"
                                        >
                                            ?
                                        </button>
                                    </div>
                                )}
                            </div>

                            <span className="lesson-vocab-chip">New phrase</span>
                        </div>

                        <p className="lesson-vocab-focus-translation">
                            {activeItem.translation}
                        </p>

                        <div className="lesson-vocab-focus-actions">
                            {audioSrc && (
                                <div className="lesson-vocab-audio-box">
                                    <span className="lesson-vocab-audio-label">
                                        Pronunciation
                                    </span>

                                    <audio
                                        key={audioSrc}
                                        controls
                                        preload="metadata"
                                        className="lesson-audio-main"
                                    >
                                        <source src={audioSrc} />
                                        Your browser does not support audio playback.
                                    </audio>

                                    {activeItem.pronunciation && (
                                        <div className="lesson-pronunciation-text">
                                            {activeItem.pronunciation}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {showUsageNote && activeItem.note && (
                            <div className="lesson-vocab-note-box">
                                <strong>Usage note</strong>
                                <p>{activeItem.note}</p>
                            </div>
                        )}

                        {activeItem.example?.english && (
                            <div className="lesson-vocab-example-box">
                                <strong>Example sentence</strong>
                                <p>{activeItem.example.english}</p>
                                {activeItem.example.translation && (
                                    <span>{activeItem.example.translation}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="lesson-vocab-focus-right">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt={activeItem.text}
                                className="lesson-vocab-focus-image"
                            />
                        ) : (
                            <div className="lesson-vocab-focus-placeholder">
                                <div className="lesson-vocab-placeholder-inner">
                                    <span className="lesson-vocab-placeholder-label">
                                        Visual reference
                                    </span>
                                    <span>{activeItem.text}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lesson-vocab-word-nav">
                    <button
                        className="lesson-secondary-btn"
                        type="button"
                        onClick={goPrevWord}
                        disabled={activeIndex === 0}
                    >
                        Previous word
                    </button>

                    <button
                        className="lesson-secondary-btn"
                        type="button"
                        onClick={goNextWord}
                        disabled={activeIndex === items.length - 1}
                    >
                        Next word
                    </button>
                </div>
            </div>

            <StepActions
                onNext={onNext}
                isLast={isLast}
                disabled={!hasReviewedAllWords}
            />
        </div>
    );
}

function MultipleChoiceStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [selected, setSelected] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setSelected("");
        setChecked(false);
    }, [step]);

    const isCorrect = selected === step.answer;
    useAnswerFeedback(checked, isCorrect);

    const handleCheck = () => {
        if (!selected) return;

        const correct = selected === step.answer;
        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.question || step.prompt,
            userAnswer: selected,
            correctAnswer: step.answer,
            isCorrect: correct,
            relatedWord,
            relatedVocabularyId,
            xpEarned: correct ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.question}</h2>

            <div className="lesson-option-list">
                {(step.options || []).map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`lesson-option-btn ${selected === option ? "active" : ""}`}
                        onClick={() => {
                            if (!checked) setSelected(option);
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Not quite"}</strong>
                    <p>{step.explanation}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function ListeningStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [selected, setSelected] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setSelected("");
        setChecked(false);
    }, [step]);

    const isCorrect = selected === step.answer;
    const audioSrc = resolveMediaUrl(step.audio);
    useAnswerFeedback(checked, isCorrect);

    const handleCheck = () => {
        if (!selected) return;

        const correct = selected === step.answer;
        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.question,
            userAnswer: selected,
            correctAnswer: step.answer,
            isCorrect: correct,
            relatedWord,
            relatedVocabularyId,
            xpEarned: correct ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.question}</h2>

            {audioSrc && (
                <audio
                    key={audioSrc}
                    controls
                    preload="metadata"
                    className="lesson-audio-main"
                >
                    <source src={audioSrc} />
                    Your browser does not support audio playback.
                </audio>
            )}

            <div className="lesson-option-list">
                {(step.options || []).map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`lesson-option-btn ${selected === option ? "active" : ""}`}
                        onClick={() => {
                            if (!checked) setSelected(option);
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Try again"}</strong>
                    <p>{step.explanation}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function SpeakingStep({ step, onNext, isLast }) {
    return (
        <div className="lesson-step-content">
            <h2>Speaking</h2>
            <p>{step.prompt}</p>

            <div className="lesson-speaking-box">
                <strong>Target:</strong> {step.targetText}
            </div>

            {step.hint && <p className="lesson-hint">{step.hint}</p>}

            <StepActions onNext={onNext} isLast={isLast} />
        </div>
    );
}

function ConversationStep({ step, onNext, isLast }) {
    const userMessages = useMemo(
        () => (step.messages || []).filter((msg) => msg.from === "user"),
        [step.messages]
    );

    const [selectedReplies, setSelectedReplies] = useState({});
    const [activePickerIndex, setActivePickerIndex] = useState(null);

    useEffect(() => {
        const initialReplies = {};

        userMessages.forEach((msg, index) => {
            if (Array.isArray(msg.options) && msg.options.length > 0) {
                initialReplies[index] = msg.options[0];
            }
        });

        setSelectedReplies(initialReplies);
        setActivePickerIndex(null);
    }, [userMessages]);

    const renderedMessages = useMemo(() => {
        let userCursor = 0;

        return (step.messages || []).map((msg, index) => {
            if (msg.from === "bot") {
                return {
                    ...msg,
                    renderType: "bot",
                    renderKey: `bot-${index}`,
                };
            }

            const selectedText =
                selectedReplies[userCursor] ||
                (Array.isArray(msg.options) && msg.options.length > 0
                    ? msg.options[0]
                    : "");

            const item = {
                ...msg,
                renderType: "user",
                renderKey: `user-${index}`,
                pickerIndex: userCursor,
                selectedText,
            };

            userCursor += 1;
            return item;
        });
    }, [step.messages, selectedReplies]);

    const handleSelectOption = (pickerIndex, option) => {
        setSelectedReplies((prev) => ({
            ...prev,
            [pickerIndex]: option,
        }));
        setActivePickerIndex(null);
    };

    return (
        <div className="lesson-step-content">
            <h2>Conversation</h2>

            <div className="lesson-chat-real">
                {renderedMessages.map((msg) => {
                    if (msg.renderType === "bot") {
                        return (
                            <div
                                key={msg.renderKey}
                                className="lesson-chat-row bot"
                            >
                                <div className="lesson-chat-avatar bot">T</div>

                                <div className="lesson-chat-bubble-real bot">
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        );
                    }

                    const options = Array.isArray(msg.options) ? msg.options : [];
                    const pickerOpen = activePickerIndex === msg.pickerIndex;

                    return (
                        <div
                            key={msg.renderKey}
                            className="lesson-chat-row user"
                        >
                            <div className="lesson-chat-user-side">
                                <div className="lesson-chat-bubble-real user">
                                    <p>{msg.selectedText}</p>
                                </div>

                                {options.length > 1 && (
                                    <button
                                        type="button"
                                        className="lesson-more-options-btn"
                                        onClick={() =>
                                            setActivePickerIndex((prev) =>
                                                prev === msg.pickerIndex ? null : msg.pickerIndex
                                            )
                                        }
                                    >
                                        More options
                                    </button>
                                )}

                                {pickerOpen && (
                                    <div
                                        className="lesson-options-modal-backdrop"
                                        onClick={() => setActivePickerIndex(null)}
                                    >
                                        <div
                                            className="lesson-options-modal"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="lesson-options-modal-head">
                                                <h3>Choose your reply</h3>
                                            </div>

                                            <div className="lesson-options-modal-list">
                                                {options.map((option, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className={`lesson-options-modal-btn ${msg.selectedText === option ? "active" : ""
                                                            }`}
                                                        onClick={() =>
                                                            handleSelectOption(msg.pickerIndex, option)
                                                        }
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                className="lesson-options-close-btn"
                                                onClick={() => setActivePickerIndex(null)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <StepActions onNext={onNext} isLast={isLast} />
        </div>
    );
}

function FillInTheBlankStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [value, setValue] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setValue("");
        setChecked(false);
    }, [step]);

    const isCorrect = isAnswerAccepted(value, step.answer, step.acceptableAnswers);
    useAnswerFeedback(checked, isCorrect);

    const handleCheck = () => {
        if (!value.trim()) return;

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt || step.sentence,
            userAnswer: value,
            correctAnswer: step.answer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Complete the sentence"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            <div className="lesson-speaking-box">
                <strong>{step.sentence}</strong>
            </div>

            <input
                className="lesson-text-input"
                value={value}
                onChange={(e) => {
                    if (!checked) setValue(e.target.value);
                }}
                placeholder="Type your answer"
            />

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Not quite"}</strong>
                    <p>{step.explanation || `Correct answer: ${step.answer}`}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function TranslateShortAnswerStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [value, setValue] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setValue("");
        setChecked(false);
    }, [step]);

    const isCorrect = isAnswerAccepted(value, step.answer, step.acceptableAnswers);
    useAnswerFeedback(checked, isCorrect);

    const handleCheck = () => {
        if (!value.trim()) return;

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt || step.sourceText,
            userAnswer: value,
            correctAnswer: step.answer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Translate"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            <div className="lesson-speaking-box">
                <strong>{step.sourceText}</strong>
            </div>

            <input
                className="lesson-text-input"
                value={value}
                onChange={(e) => {
                    if (!checked) setValue(e.target.value);
                }}
                placeholder="Write the translation"
            />

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Try again"}</strong>
                    <p>{step.explanation || `Correct answer: ${step.answer}`}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function ListeningTypeStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [value, setValue] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setValue("");
        setChecked(false);
    }, [step]);

    const audioSrc = resolveMediaUrl(step.audio);
    const isCorrect = isAnswerAccepted(value, step.answer, step.acceptableAnswers);
    useAnswerFeedback(checked, isCorrect);

    const handleCheck = () => {
        if (!value.trim()) return;

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt,
            userAnswer: value,
            correctAnswer: step.answer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Listening and type"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            {audioSrc && (
                <audio
                    key={audioSrc}
                    controls
                    preload="metadata"
                    className="lesson-audio-main"
                >
                    <source src={audioSrc} />
                    Your browser does not support audio playback.
                </audio>
            )}

            <input
                className="lesson-text-input"
                value={value}
                onChange={(e) => {
                    if (!checked) setValue(e.target.value);
                }}
                placeholder="Type what you hear"
            />

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Not quite"}</strong>
                    <p>{step.explanation || `Correct answer: ${step.answer}`}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function LetterBankStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [selectedLetters, setSelectedLetters] = useState([]);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setSelectedLetters([]);
        setChecked(false);
    }, [step]);

    const currentAnswer = selectedLetters.map((item) => item.value).join("");
    const isCorrect = normalizeText(currentAnswer) === normalizeText(step.answer);
    useAnswerFeedback(checked, isCorrect);

    const handleSelectLetter = (letter, index) => {
        if (checked) return;
        setSelectedLetters((prev) => [...prev, { value: letter, index }]);
    };

    const handleRemoveLast = () => {
        if (checked) return;
        setSelectedLetters((prev) => prev.slice(0, -1));
    };

    const handleReset = () => {
        if (checked) return;
        setSelectedLetters([]);
    };

    const usedIndexes = selectedLetters.map((item) => item.index);

    const handleCheck = () => {
        if (!currentAnswer.trim()) return;

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt || step.template,
            userAnswer: currentAnswer,
            correctAnswer: step.answer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Build the word"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            <div className="lesson-speaking-box">
                <strong>{step.template}</strong>
            </div>

            <div className="lesson-speaking-box">
                <strong>{currentAnswer || "..."}</strong>
            </div>

            <div className="lesson-option-list">
                {(step.letters || []).map((letter, index) => (
                    <button
                        key={`${letter}-${index}`}
                        type="button"
                        className={`lesson-option-btn ${usedIndexes.includes(index) ? "active" : ""}`}
                        disabled={usedIndexes.includes(index) || checked}
                        onClick={() => handleSelectLetter(letter, index)}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            <div className="lesson-actions lesson-actions-end">
                <button className="lesson-secondary-btn" type="button" onClick={handleRemoveLast} disabled={checked}>
                    Remove last
                </button>

                <button className="lesson-secondary-btn" type="button" onClick={handleReset} disabled={checked}>
                    Reset
                </button>
            </div>

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Try again"}</strong>
                    <p>{step.explanation || `Correct answer: ${step.answer}`}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function UnscrambleStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [pool, setPool] = useState([]);
    const [selectedWords, setSelectedWords] = useState([]);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const shuffled = shuffleArray(step.words || []);
        setPool(shuffled.map((word, index) => ({ value: word, id: `${word}-${index}` })));
        setSelectedWords([]);
        setChecked(false);
    }, [step]);

    const sentence = selectedWords.map((item) => item.value).join(" ");
    const isCorrect = normalizeText(sentence) === normalizeText(step.answer);
    useAnswerFeedback(checked, isCorrect);

    const handlePickWord = (word) => {
        if (checked) return;
        setPool((prev) => prev.filter((item) => item.id !== word.id));
        setSelectedWords((prev) => [...prev, word]);
    };

    const handleRemoveWord = (word) => {
        if (checked) return;
        setSelectedWords((prev) => prev.filter((item) => item.id !== word.id));
        setPool((prev) => [...prev, word]);
    };

    const handleReset = () => {
        if (checked) return;
        const merged = [...pool, ...selectedWords];
        setPool(shuffleArray(merged));
        setSelectedWords([]);
    };

    const handleCheck = () => {
        if (!sentence.trim()) return;

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt,
            userAnswer: sentence,
            correctAnswer: step.answer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Unscramble"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            <div className="lesson-speaking-box">
                <strong>{sentence || "Tap the words in the correct order"}</strong>
            </div>

            <div className="lesson-option-list">
                {selectedWords.map((word) => (
                    <button
                        key={word.id}
                        type="button"
                        className="lesson-option-btn active"
                        disabled={checked}
                        onClick={() => handleRemoveWord(word)}
                    >
                        {word.value}
                    </button>
                ))}
            </div>

            <div className="lesson-option-list">
                {pool.map((word) => (
                    <button
                        key={word.id}
                        type="button"
                        className="lesson-option-btn"
                        disabled={checked}
                        onClick={() => handlePickWord(word)}
                    >
                        {word.value}
                    </button>
                ))}
            </div>

            <div className="lesson-actions lesson-actions-end">
                <button className="lesson-secondary-btn" type="button" onClick={handleReset} disabled={checked}>
                    Reset
                </button>
            </div>

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Not quite"}</strong>
                    <p>{step.explanation || `Correct answer: ${step.answer}`}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function MatchPairsStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [selectedLeft, setSelectedLeft] = useState("");
    const [matches, setMatches] = useState({});
    const [checked, setChecked] = useState(false);

    const leftItems = (step.pairs || []).map((pair) => pair.left);
    const rightItems = useMemo(
        () => shuffleArray((step.pairs || []).map((pair) => pair.right)),
        [step]
    );

    const pairMap = useMemo(() => {
        const map = {};
        (step.pairs || []).forEach((pair) => {
            map[pair.left] = pair.right;
        });
        return map;
    }, [step]);

    const matchedCount = Object.keys(matches).length;
    const totalPairs = (step.pairs || []).length;
    const isComplete = totalPairs > 0 && matchedCount === totalPairs;

    const isCorrect =
        isComplete &&
        leftItems.every((left) => normalizeText(matches[left]) === normalizeText(pairMap[left]));
    useAnswerFeedback(checked, isCorrect);

    const handleChooseRight = (right) => {
        if (checked || !selectedLeft) return;

        setMatches((prev) => ({
            ...prev,
            [selectedLeft]: right,
        }));

        setSelectedLeft("");
    };

    const handleCheck = () => {
        if (!isComplete) return;

        const userAnswer = leftItems
            .map((left) => `${left} = ${matches[left]}`)
            .join(" | ");

        const correctAnswer = leftItems
            .map((left) => `${left} = ${pairMap[left]}`)
            .join(" | ");

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, correctAnswer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt,
            userAnswer,
            correctAnswer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Match pairs"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            <div className="lesson-match-layout">
                <div className="lesson-match-column">
                    <h3>Left</h3>
                    {(leftItems || []).map((left) => (
                        <button
                            key={left}
                            type="button"
                            className={`lesson-option-btn ${selectedLeft === left ? "active" : ""}`}
                            disabled={checked}
                            onClick={() => setSelectedLeft(left)}
                        >
                            {left}
                            {matches[left] ? ` → ${matches[left]}` : ""}
                        </button>
                    ))}
                </div>

                <div className="lesson-match-column">
                    <h3>Right</h3>
                    {(rightItems || []).map((right) => (
                        <button
                            key={right}
                            type="button"
                            className="lesson-option-btn"
                            disabled={checked || !selectedLeft}
                            onClick={() => handleChooseRight(right)}
                        >
                            {right}
                        </button>
                    ))}
                </div>
            </div>

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Not quite"}</strong>
                    <p>{step.explanation || "Review the pairs and try again."}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button" disabled={!isComplete}>
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function ImageChoiceStep({ step, stepIndex, onNext, onRecordAnswer }) {
    const [selected, setSelected] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setSelected("");
        setChecked(false);
    }, [step]);

    const isCorrect = selected === step.answer;
    const imageSrc = resolveMediaUrl(step.image);
    useAnswerFeedback(checked, isCorrect);

    const handleCheck = () => {
        if (!selected) return;

        const { relatedWord, relatedVocabularyId } = extractRelatedData(step, step.answer);

        onRecordAnswer({
            stepIndex,
            stepType: step.type,
            prompt: step.prompt,
            userAnswer: selected,
            correctAnswer: step.answer,
            isCorrect,
            relatedWord,
            relatedVocabularyId,
            xpEarned: isCorrect ? 1 : 0,
        });

        setChecked(true);
    };

    return (
        <div className="lesson-step-content">
            <h2>{step.title || "Image choice"}</h2>
            {step.prompt && <p>{step.prompt}</p>}

            {imageSrc && (
                <div className="lesson-vocab-focus-right" style={{ marginBottom: 20 }}>
                    <img
                        src={imageSrc}
                        alt="Question visual"
                        className="lesson-vocab-focus-image"
                    />
                </div>
            )}

            <div className="lesson-option-list">
                {(step.options || []).map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`lesson-option-btn ${selected === option ? "active" : ""}`}
                        onClick={() => {
                            if (!checked) setSelected(option);
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <InlineAnswerReaction checked={checked} isCorrect={isCorrect} />

            {checked && (
                <div className={`lesson-feedback ${isCorrect ? "correct" : "wrong"} lesson-feedback-animated`}>
                    <strong>{isCorrect ? "Correct!" : "Try again"}</strong>
                    <p>{step.explanation || `Correct answer: ${step.answer}`}</p>
                </div>
            )}

            <div className="lesson-actions lesson-actions-end">
                {!checked ? (
                    <button className="lesson-primary-btn" onClick={handleCheck} type="button">
                        Check
                    </button>
                ) : (
                    <button className="lesson-primary-btn" onClick={onNext} type="button">
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}

function DefaultStep({ step, onNext, isLast }) {
    return (
        <div className="lesson-step-content">
            <h2>{step?.title || "Lesson Step"}</h2>
            <p>This step type is not supported yet.</p>

            <StepActions onNext={onNext} isLast={isLast} />
        </div>
    );
}

function LessonResultScreen({ result, onRetry, onExit }) {
    const passed = result?.passed;
    const finalScore = result?.score || 0;
    const finalXp = result?.xpEarned || 0;
    const progress = result?.progress || {};
    const unlockedNextLesson = result?.unlockedNextLesson;

    const [animatedScore, setAnimatedScore] = useState(0);
    const [animatedAttempts, setAnimatedAttempts] = useState(0);
    const [animatedBest, setAnimatedBest] = useState(0);

    useEffect(() => {
        let frameId;
        let start;

        const duration = 1400;
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const tick = (timestamp) => {
            if (!start) start = timestamp;

            const elapsed = timestamp - start;
            const rawProgress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(rawProgress);

            setAnimatedScore(Math.round(finalScore * easedProgress));
            setAnimatedAttempts(Math.round((progress.attemptsCount || 0) * easedProgress));
            setAnimatedBest(Math.round((progress.bestScore || 0) * easedProgress));

            if (rawProgress < 1) {
                frameId = requestAnimationFrame(tick);
            }
        };

        frameId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frameId);
    }, [finalScore, progress.attemptsCount, progress.bestScore]);

    useEffect(() => {
        if (!passed) return;

        const timer = setTimeout(() => {
            confetti({
                particleCount: 110,
                spread: 78,
                startVelocity: 42,
                scalar: 0.95,
                origin: { y: 0.6 },
            });

            confetti({
                particleCount: 70,
                angle: 60,
                spread: 55,
                origin: { x: 0.16, y: 0.62 },
            });

            confetti({
                particleCount: 70,
                angle: 120,
                spread: 55,
                origin: { x: 0.84, y: 0.62 },
            });
        }, 260);

        return () => clearTimeout(timer);
    }, [passed]);

    const circleDegrees = (animatedScore / 100) * 360;

    return (
        <motion.div
            className="lesson-result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={`lesson-result-card ${passed ? "passed" : "failed"}`}
                initial={{ opacity: 0, scale: 0.88, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
            >
                <motion.div
                    className="lesson-result-icon"
                    initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
                >
                    {passed ? "🎉" : "📘"}
                </motion.div>

                <motion.p
                    className="lesson-kicker"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                >
                    Lesson Result
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                >
                    {passed ? "You passed!" : "Keep practicing"}
                </motion.h2>

                <motion.div
                    className="lesson-result-score-wrap"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div
                        className="lesson-result-score-circle animated"
                        style={{
                            background: `conic-gradient(
                                #5b7cff 0deg,
                                #7c4dff ${circleDegrees}deg,
                                #e8eefc ${circleDegrees}deg,
                                #e8eefc 360deg
                            )`,
                        }}
                    >
                        <div className="lesson-result-score-inner">
                            <span>{animatedScore}%</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="lesson-result-bar"
                    initial={{ opacity: 0, scaleX: 0.6 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                >
                    <motion.div
                        className="lesson-result-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${animatedScore}%` }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.35 }}
                    />
                </motion.div>

                <motion.div
                    className="lesson-result-stats"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.div
                        className="lesson-result-stat lesson-result-stat-xp"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 }}
                    >
                        <span>XP Earned</span>
                        <XPBurst xp={finalXp} />
                    </motion.div>

                    <motion.div
                        className="lesson-result-stat"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.52 }}
                    >
                        <span>Attempts</span>
                        <strong>{animatedAttempts}</strong>
                    </motion.div>

                    <motion.div
                        className="lesson-result-stat"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.59 }}
                    >
                        <span>Best</span>
                        <strong>{animatedBest}%</strong>
                    </motion.div>
                </motion.div>

                {!passed && (
                    <motion.p
                        className="lesson-result-note"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65 }}
                    >
                        You need at least <strong>{result.passThreshold || 70}%</strong> to unlock the next lesson.
                    </motion.p>
                )}

                {passed && unlockedNextLesson && (
                    <motion.p
                        className="lesson-result-note success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65 }}
                    >
                        Next lesson unlocked: <strong>{unlockedNextLesson.title}</strong>
                    </motion.p>
                )}

                <motion.div
                    className="lesson-result-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.72 }}
                >
                    {!passed && (
                        <button className="lesson-secondary-btn" type="button" onClick={onRetry}>
                            Retry lesson
                        </button>
                    )}

                    <motion.button
                        className="lesson-primary-btn lesson-result-continue-btn"
                        type="button"
                        onClick={onExit}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        {passed ? "Continue" : "Exit"}
                    </motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

function StreakRewardOverlay({ streakValue = 1, onArrive, onComplete }) {
    const [displayStreak, setDisplayStreak] = useState(0);
    const [phase, setPhase] = useState("orb");
    const [flightStyle, setFlightStyle] = useState({});
    const [overlayFading, setOverlayFading] = useState(false);

    const arriveCalledRef = useRef(false);
    const completeCalledRef = useRef(false);

    const onArriveRef = useRef(onArrive);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onArriveRef.current = onArrive;
    }, [onArrive]);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        arriveCalledRef.current = false;
        completeCalledRef.current = false;

        let frameId;
        let start;

        const duration = 1000;

        const tick = (timestamp) => {
            if (!start) start = timestamp;

            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setDisplayStreak(Math.max(1, Math.round(streakValue * eased)));

            if (progress < 1) {
                frameId = requestAnimationFrame(tick);
            }
        };

        frameId = requestAnimationFrame(tick);

        const lockTargetTimer = setTimeout(() => {
            const target =
                document.querySelector("[data-streak-target]") ||
                document.getElementById("navbar-streak-target");

            if (target) {
                const rect = target.getBoundingClientRect();

                const targetCenterX = rect.left + rect.width / 2;
                const targetCenterY = rect.top + rect.height / 2;
                const viewportCenterX = window.innerWidth / 2;
                const viewportCenterY = window.innerHeight / 2;

                const deltaX = targetCenterX - viewportCenterX;
                const deltaY = targetCenterY - viewportCenterY;

                setFlightStyle({
                    "--streak-target-x": `${deltaX}px`,
                    "--streak-target-y": `${deltaY}px`,
                });
            }
        }, 900);

        const explodeTimer = setTimeout(() => {
            setPhase("explode");
        }, 900);

        const flameTimer = setTimeout(() => {
            setPhase("flame");
        }, 1450);

        const flyTimer = setTimeout(() => {
            setOverlayFading(true);
            setPhase("fly");
        }, 2900);

        const arriveTimer = setTimeout(() => {
            if (!arriveCalledRef.current) {
                arriveCalledRef.current = true;
                onArriveRef.current?.();
            }
        }, 3400);

        const doneTimer = setTimeout(() => {
            if (!completeCalledRef.current) {
                completeCalledRef.current = true;
                onCompleteRef.current?.();
            }
        }, 3650);

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(lockTargetTimer);
            clearTimeout(explodeTimer);
            clearTimeout(flameTimer);
            clearTimeout(flyTimer);
            clearTimeout(arriveTimer);
            clearTimeout(doneTimer);
        };
    }, [streakValue]);

    const isExploding = phase === "explode";
    const showFlame = phase === "flame" || phase === "fly";
    const isFlying = phase === "fly";

    return (
        <motion.div
            className={`streak-overlay ${overlayFading ? "fade-out-fast" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={`streak-flame-wrap ${isFlying ? "fly-to-navbar-real" : ""}`}
                style={flightStyle}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >
                {!showFlame && (
                    <div className={`streak-orb ${isExploding ? "explode" : ""}`} />
                )}

                {isExploding && (
                    <>
                        <div className="streak-spark streak-spark-1 show" />
                        <div className="streak-spark streak-spark-2 show" />
                        <div className="streak-spark streak-spark-3 show" />
                        <div className="streak-spark streak-spark-4 show" />
                        <div className="streak-spark streak-spark-5 show" />
                        <div className="streak-spark streak-spark-6 show" />
                    </>
                )}

                {showFlame && (
                    <>
                        <div className="streak-flame-glow streak-glow-1" />
                        <div className="streak-flame-glow streak-glow-2" />
                        <div className="streak-flame-trail" />
                        <div className="streak-flame-core">🔥</div>
                    </>
                )}

                <motion.div
                    className="streak-fire-content"
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{
                        opacity: showFlame ? 1 : 0,
                        y: showFlame ? 0 : 12,
                        scale: showFlame ? 1 : 0.9,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <div className="streak-label">Daily Streak</div>
                    <div className="streak-value">{displayStreak}</div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { API_URL } from "../lib/config";
import "../styles/ModuleTestPlayer.css";

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function resolveMediaUrl(value) {
    if (!value || typeof value !== "string") return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_URL}${value}`;
}

export default function ModuleTestPlayer() {
    const navigate = useNavigate();
    const { testId } = useParams();
    const { user } = useOutletContext();

    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [scoreResult, setScoreResult] = useState(null);
    const [pairChoicesMap, setPairChoicesMap] = useState({});

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setLoading(true);

                const res = await fetch(`${API_URL}/api/module-tests/${testId}`);

                if (!res.ok) {
                    throw new Error("Failed to load module test");
                }

                const json = await res.json();
                setTestData(json);
            } catch (error) {
                console.error("Error loading module test:", error);
                setTestData(null);
            } finally {
                setLoading(false);
            }
        };

        if (testId) {
            fetchTest();
        }
    }, [testId]);

    const questions = useMemo(() => {
        return Array.isArray(testData?.questions) ? testData.questions : [];
    }, [testData]);

    const currentQuestion = questions[currentIndex];

    useEffect(() => {
        if (!currentQuestion || currentQuestion.type !== "match-pairs") return;

        const existing = pairChoicesMap[currentIndex];
        if (existing) return;

        const rightValues = (currentQuestion.pairs || []).map((pair) => pair.right);
        setPairChoicesMap((prev) => ({
            ...prev,
            [currentIndex]: shuffleArray(rightValues),
        }));
    }, [currentQuestion, currentIndex, pairChoicesMap]);

    const totalPoints = useMemo(() => {
        return questions.reduce((sum, question) => sum + Number(question.points || 10), 0);
    }, [questions]);

    const progressPercent = questions.length
        ? Math.round(((currentIndex + 1) / questions.length) * 100)
        : 0;

    const setAnswer = (value) => {
        setAnswers((prev) => ({
            ...prev,
            [currentIndex]: value,
        }));
    };

    const currentAnswer = answers[currentIndex];

    const isQuestionAnswered = useMemo(() => {
        if (!currentQuestion) return false;

        switch (currentQuestion.type) {
            case "multiple-choice":
            case "listening":
            case "image-choice":
                return !!currentAnswer;

            case "fill-in-the-blank":
            case "translate-short-answer":
            case "unscramble":
            case "speaking":
                return !!String(currentAnswer || "").trim();

            case "match-pairs":
                return (
                    currentAnswer &&
                    typeof currentAnswer === "object" &&
                    (currentQuestion.pairs || []).every(
                        (pair) => currentAnswer[pair.left]
                    )
                );

            default:
                return !!currentAnswer;
        }
    }, [currentAnswer, currentQuestion]);

    const evaluateQuestion = (question, answer) => {
        const points = Number(question.points || 10);

        switch (question.type) {
            case "multiple-choice":
            case "listening":
            case "image-choice": {
                const isCorrect = normalizeText(answer) === normalizeText(question.answer);
                return {
                    isCorrect,
                    earnedPoints: isCorrect ? points : 0,
                };
            }

            case "fill-in-the-blank":
            case "translate-short-answer": {
                const validAnswers = [
                    question.answer,
                    ...(Array.isArray(question.acceptableAnswers)
                        ? question.acceptableAnswers
                        : []),
                ].map(normalizeText);

                const isCorrect = validAnswers.includes(normalizeText(answer));
                return {
                    isCorrect,
                    earnedPoints: isCorrect ? points : 0,
                };
            }

            case "unscramble": {
                const isCorrect = normalizeText(answer) === normalizeText(question.answer);
                return {
                    isCorrect,
                    earnedPoints: isCorrect ? points : 0,
                };
            }

            case "match-pairs": {
                const userMap = answer || {};
                const allCorrect = (question.pairs || []).every(
                    (pair) => normalizeText(userMap[pair.left]) === normalizeText(pair.right)
                );

                return {
                    isCorrect: allCorrect,
                    earnedPoints: allCorrect ? points : 0,
                };
            }

            case "speaking": {
                const hasSomething = !!String(answer || "").trim();
                return {
                    isCorrect: hasSomething,
                    earnedPoints: hasSomething ? points : 0,
                };
            }

            default:
                return {
                    isCorrect: false,
                    earnedPoints: 0,
                };
        }
    };

    const handleNext = () => {
        if (!currentQuestion || !isQuestionAnswered) return;

        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleSubmitTest = async () => {
        const results = questions.map((question, index) => {
            const answer = answers[index];
            return {
                question,
                answer,
                ...evaluateQuestion(question, answer),
            };
        });

        const earnedPoints = results.reduce(
            (sum, item) => sum + item.earnedPoints,
            0
        );

        const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = percent >= Number(testData?.passingScore || 70);

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/module-test-progress/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    userId: user?._id,
                    courseId: testData.courseId,
                    moduleId: testData.moduleId,
                    moduleTestId: testData._id,
                    score: percent,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Error saving module test progress:", errorData);
            }
        } catch (error) {
            console.error("Error saving module test progress:", error);
        }

        setScoreResult({
            results,
            earnedPoints,
            totalPoints,
            percent,
            passed,
        });

        setSubmitted(true);
    };

    const handleRestart = () => {
        setAnswers({});
        setCurrentIndex(0);
        setSubmitted(false);
        setScoreResult(null);
        setPairChoicesMap({});
    };

    if (!user?._id) {
        return null;
    }

    if (loading) {
        return (
            <div className="module-test-page">
                <div className="module-test-shell">
                    <div className="module-test-loading">Loading test...</div>
                </div>
            </div>
        );
    }

    if (!testData) {
        return (
            <div className="module-test-page">
                <div className="module-test-shell">
                    <div className="module-test-empty">Module test not found.</div>
                </div>
            </div>
        );
    }

    if (submitted && scoreResult) {
        return (
            <div className="module-test-page">
                <div className="module-test-shell">
                    <div className="module-test-result-card">
                        <p className="module-test-kicker">Final Result</p>
                        <h1>{testData.title}</h1>
                        <p className="module-test-result-percent">
                            {scoreResult.percent}%
                        </p>

                        <div className="module-test-result-pill-row">
                            <span className="module-test-pill">
                                {scoreResult.earnedPoints}/{scoreResult.totalPoints} points
                            </span>
                            <span className="module-test-pill">
                                Passing score: {testData.passingScore}%
                            </span>
                            <span
                                className={`module-test-pill ${scoreResult.passed ? "success" : "danger"
                                    }`}
                            >
                                {scoreResult.passed ? "Passed" : "Not passed"}
                            </span>
                        </div>

                        <div className="module-test-review-list">
                            {scoreResult.results.map((item, index) => (
                                <div
                                    key={index}
                                    className={`module-test-review-item ${item.isCorrect ? "correct" : "incorrect"
                                        }`}
                                >
                                    <div className="module-test-review-top">
                                        <strong>
                                            Question {index + 1} · {item.question.type}
                                        </strong>
                                        <span>
                                            {item.isCorrect ? "Correct" : "Incorrect"}
                                        </span>
                                    </div>

                                    <p>
                                        {item.question.question ||
                                            item.question.prompt ||
                                            item.question.sentence ||
                                            item.question.sourceText ||
                                            "Question"}
                                    </p>

                                    {!!item.question.explanation && (
                                        <small>{item.question.explanation}</small>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="module-test-action-row">
                            <button
                                type="button"
                                className="module-test-secondary-btn"
                                onClick={() => navigate("/dashboard/learn/course")}
                            >
                                Back to course
                            </button>

                            <button
                                type="button"
                                className="module-test-primary-btn"
                                onClick={handleRestart}
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="module-test-page">
            <div className="module-test-shell">
                <div className="module-test-header-card">
                    <div>
                        <p className="module-test-kicker">Module Final Exam</p>
                        <h1>{testData.title}</h1>
                        <p className="module-test-subtitle">
                            {testData.description || "Complete the exam and do your best."}
                        </p>
                    </div>

                    <div className="module-test-meta">
                        <span>{questions.length} questions</span>
                        <span>{testData.estimatedMinutes || 10} min</span>
                        <span>Pass: {testData.passingScore || 70}%</span>
                    </div>
                </div>

                <div className="module-test-progress-wrap">
                    <div className="module-test-progress-top">
                        <span>
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        <span>{progressPercent}%</span>
                    </div>

                    <div className="module-test-progress-bar">
                        <div
                            className="module-test-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {currentQuestion && (
                    <div className="module-test-question-card">
                        <div className="module-test-question-head">
                            <span className="module-test-question-type">
                                {currentQuestion.type}
                            </span>
                            <h2>
                                {currentQuestion.title ||
                                    `Question ${currentIndex + 1}`}
                            </h2>
                            {currentQuestion.instruction && (
                                <p>{currentQuestion.instruction}</p>
                            )}
                        </div>

                        {!!currentQuestion.prompt && (
                            <div className="module-test-prompt-box">
                                {currentQuestion.prompt}
                            </div>
                        )}

                        {currentQuestion.type === "multiple-choice" && (
                            <>
                                <h3 className="module-test-question-text">
                                    {currentQuestion.question}
                                </h3>

                                <div className="module-test-option-list">
                                    {(currentQuestion.options || []).map((option, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`module-test-option ${currentAnswer === option ? "selected" : ""
                                                }`}
                                            onClick={() => setAnswer(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {currentQuestion.type === "listening" && (
                            <>
                                {!!currentQuestion.audio && (
                                    <audio
                                        controls
                                        className="module-test-audio-player"
                                    >
                                        <source src={resolveMediaUrl(currentQuestion.audio)} />
                                        Your browser does not support audio.
                                    </audio>
                                )}

                                <h3 className="module-test-question-text">
                                    {currentQuestion.question}
                                </h3>

                                <div className="module-test-option-list">
                                    {(currentQuestion.options || []).map((option, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`module-test-option ${currentAnswer === option ? "selected" : ""
                                                }`}
                                            onClick={() => setAnswer(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {currentQuestion.type === "fill-in-the-blank" && (
                            <>
                                <h3 className="module-test-question-text">
                                    {currentQuestion.sentence}
                                </h3>

                                <input
                                    className="module-test-input"
                                    value={currentAnswer || ""}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type your answer"
                                />
                            </>
                        )}

                        {currentQuestion.type === "translate-short-answer" && (
                            <>
                                <h3 className="module-test-question-text">
                                    {currentQuestion.sourceText}
                                </h3>

                                <input
                                    className="module-test-input"
                                    value={currentAnswer || ""}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type the translation"
                                />
                            </>
                        )}

                        {currentQuestion.type === "unscramble" && (
                            <>
                                <div className="module-test-chip-row">
                                    {(currentQuestion.words || []).map((word, index) => (
                                        <span key={index} className="module-test-chip">
                                            {word}
                                        </span>
                                    ))}
                                </div>

                                <input
                                    className="module-test-input"
                                    value={currentAnswer || ""}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Write the correct sentence"
                                />
                            </>
                        )}

                        {currentQuestion.type === "image-choice" && (
                            <>
                                {!!currentQuestion.image && (
                                    <img
                                        src={resolveMediaUrl(currentQuestion.image)}
                                        alt="Question"
                                        className="module-test-image"
                                    />
                                )}

                                <h3 className="module-test-question-text">
                                    {currentQuestion.question}
                                </h3>

                                <div className="module-test-option-list">
                                    {(currentQuestion.options || []).map((option, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`module-test-option ${currentAnswer === option ? "selected" : ""
                                                }`}
                                            onClick={() => setAnswer(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {currentQuestion.type === "speaking" && (
                            <>
                                <h3 className="module-test-question-text">
                                    {currentQuestion.targetText || currentQuestion.prompt}
                                </h3>

                                {!!currentQuestion.hint && (
                                    <div className="module-test-hint-box">
                                        {currentQuestion.hint}
                                    </div>
                                )}

                                <textarea
                                    className="module-test-textarea"
                                    value={currentAnswer || ""}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="For now, type what you would say..."
                                />
                            </>
                        )}

                        {currentQuestion.type === "match-pairs" && (
                            <>
                                <h3 className="module-test-question-text">
                                    Match each item with the correct pair
                                </h3>

                                <div className="module-test-pair-list">
                                    {(currentQuestion.pairs || []).map((pair, index) => (
                                        <div key={index} className="module-test-pair-row">
                                            <div className="module-test-pair-left">
                                                {pair.left}
                                            </div>

                                            <select
                                                className="module-test-select"
                                                value={currentAnswer?.[pair.left] || ""}
                                                onChange={(e) =>
                                                    setAnswer({
                                                        ...(currentAnswer || {}),
                                                        [pair.left]: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">Select match</option>
                                                {(pairChoicesMap[currentIndex] || []).map(
                                                    (choice, choiceIndex) => (
                                                        <option
                                                            key={choiceIndex}
                                                            value={choice}
                                                        >
                                                            {choice}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="module-test-nav-row">
                            <button
                                type="button"
                                className="module-test-secondary-btn"
                                onClick={handleBack}
                                disabled={currentIndex === 0}
                            >
                                Back
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    type="button"
                                    className="module-test-primary-btn"
                                    onClick={handleNext}
                                    disabled={!isQuestionAnswered}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="module-test-primary-btn"
                                    onClick={handleSubmitTest}
                                    disabled={!isQuestionAnswered}
                                >
                                    Finish test
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Sparkles,
    Languages,
    CheckCircle2,
    HelpCircle,
    PencilLine,
    BookOpen,
} from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/CardsReviewPage.css";

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

function normalizeText(text = "") {
    return String(text)
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getReviewMode(search) {
    const params = new URLSearchParams(search);
    const mode = params.get("mode");
    return mode === "writing" ? "writing" : "meaning";
}

function getTargetLanguageLabel(card, t) {
    return card?.language || t("cards.savedPhrase");
}

export default function CardsReviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const reviewMode = useMemo(() => getReviewMode(location.search), [location.search]);

    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const [sessionFinished, setSessionFinished] = useState(false);
    const [answeredCount, setAnsweredCount] = useState(0);

    const currentItem = queue[currentIndex] || null;
    const currentCard = currentItem?.card || null;

    const progressPercent = useMemo(() => {
        if (!queue.length) return 0;
        return Math.round((answeredCount / queue.length) * 100);
    }, [answeredCount, queue.length]);

    const fetchPracticeCards = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getAuthToken();

            const response = await fetch(`${API_URL}/api/vocabulary/practice`, {
                method: "GET",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
            });

            const data = await response.json().catch(() => []);

            if (!response.ok) {
                throw new Error(data?.error || t("review.failedLoad"));
            }

            const safeQueue = Array.isArray(data) ? data : [];

            setQueue(safeQueue);
            setCurrentIndex(0);
            setInput("");
            setShowResult(false);
            setResult(null);
            setAnsweredCount(0);
            setSessionFinished(safeQueue.length === 0);
        } catch (err) {
            console.error("Practice fetch error:", err);
            setError(err.message || t("review.failedLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPracticeCards();
    }, [reviewMode]);

    const submitReviewResult = async ({ knewIt = false }) => {
        if (!currentCard) return;

        try {
            const token = getAuthToken();

            const response = await fetch(`${API_URL}/api/vocabulary/practice/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify({
                    cardId: currentCard._id,
                    answer: input,
                    knewIt,
                    mode: reviewMode,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || t("review.failedSubmit"));
            }

            setResult(data);
            setShowResult(true);
            setAnsweredCount((prev) => prev + 1);
        } catch (err) {
            console.error("Submit review error:", err);
            setError(err.message || t("review.failedSubmit"));
        }
    };

    const handleCheck = async () => {
        if (!normalizeText(input)) return;
        await submitReviewResult({ knewIt: false });
    };

    const handleDontKnow = async () => {
        await submitReviewResult({ knewIt: true });
    };

    const handleNext = () => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
            setSessionFinished(true);
            return;
        }

        setCurrentIndex(nextIndex);
        setInput("");
        setShowResult(false);
        setResult(null);
    };

    const getResultMessage = () => {
        if (!result) return "";
        if (result.isCorrect) return t("review.correct");
        if (result.isAlmostCorrect) return t("review.almost");
        return t("review.wrong");
    };

    const getFrontText = () => {
        if (!currentCard) return "";
        return reviewMode === "writing"
            ? currentCard.translation || t("review.noTranslation")
            : currentCard.text;
    };

    const getInputPlaceholder = () => {
        const targetLanguage = getTargetLanguageLabel(currentCard, t);

        if (reviewMode !== "writing") {
            return t("review.placeholderMeaning");
        }

        if (targetLanguage.toLowerCase() === "japanese") {
            return t("review.placeholderJapanese");
        }

        return `${t("review.writeIn")} ${targetLanguage}...`;
    };

    const getModeTitle = () => {
        return reviewMode === "writing"
            ? t("review.writingTitle")
            : t("review.meaningTitle");
    };

    const getModeDescription = () => {
        return reviewMode === "writing"
            ? t("review.writingDesc")
            : t("review.meaningDesc");
    };

    const getModeIcon = () => {
        return reviewMode === "writing" ? (
            <PencilLine size={14} />
        ) : (
            <BookOpen size={14} />
        );
    };

    const getAnswerBlockTitle = () => {
        return reviewMode === "writing"
            ? t("review.correctPhrase")
            : t("review.answer");
    };

    const getWritingHint = () => {
        const targetLanguage = getTargetLanguageLabel(currentCard, t);

        if (targetLanguage.toLowerCase() === "japanese") {
            return t("review.tryWriteJapanese");
        }

        return `${t("review.tryWriteIn")} ${targetLanguage}`;
    };

    return (
        <div className="cards-review-page">
            <div className="cards-review-shell">
                <section className="cards-review-hero">
                    <button
                        type="button"
                        className="cards-review-back-btn"
                        onClick={() => navigate("/dashboard/cards")}
                    >
                        <ArrowLeft size={18} />
                        <span>{t("review.back")}</span>
                    </button>

                    <div className="cards-review-kicker">
                        <Sparkles size={14} />
                        <span>{getModeTitle()}</span>
                    </div>

                    <h1>{getModeTitle()}</h1>
                    <p>{getModeDescription()}</p>

                    <div className="cards-review-mode-chip">
                        {getModeIcon()}
                        <span>
                            {reviewMode === "writing"
                                ? t("review.writingMode")
                                : t("review.meaningMode")}
                        </span>
                    </div>
                </section>

                {loading ? (
                    <div className="cards-review-state-card">
                        <p>{t("review.loading")}</p>
                    </div>
                ) : error ? (
                    <div className="cards-review-state-card error">
                        <p>{error}</p>
                    </div>
                ) : sessionFinished ? (
                    <div className="cards-review-finished">
                        <div className="cards-review-finished-icon">
                            <CheckCircle2 size={30} />
                        </div>

                        <h2>{t("review.finishedTitle")}</h2>
                        <p>{t("review.finishedText")}</p>

                        <div className="cards-review-finished-actions">
                            <button
                                type="button"
                                className="cards-review-secondary-btn"
                                onClick={fetchPracticeCards}
                            >
                                {t("review.practiceAgain")}
                            </button>

                            <button
                                type="button"
                                className="cards-review-primary-btn"
                                onClick={() => navigate("/dashboard/cards")}
                            >
                                {t("review.backToCards")}
                            </button>
                        </div>
                    </div>
                ) : !currentCard ? (
                    <div className="cards-review-state-card">
                        <p>{t("review.noCards")}</p>
                    </div>
                ) : (
                    <>
                        <section className="cards-review-progress-wrap">
                            <div className="cards-review-progress-top">
                                <span>
                                    {t("review.progress")} {Math.min(currentIndex + 1, queue.length)}{" "}
                                    {t("review.of")} {queue.length}
                                </span>
                                <span>{progressPercent}%</span>
                            </div>

                            <div className="cards-review-progress-bar">
                                <div
                                    className="cards-review-progress-fill"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </section>

                        <section className="cards-review-card-wrap">
                            <div className="cards-review-card">
                                <div className="cards-review-card-top">
                                    <span className="cards-review-card-badge">
                                        <Languages size={13} />
                                        {currentCard.language || t("cards.savedPhrase")}
                                    </span>
                                </div>

                                <div className="cards-review-card-body">
                                    <p className="cards-review-label">{t("review.front")}</p>
                                    <h2>{getFrontText()}</h2>

                                    {!showResult ? (
                                        <div className="cards-review-hidden">
                                            <HelpCircle size={18} />
                                            <span>
                                                {reviewMode === "writing"
                                                    ? getWritingHint()
                                                    : t("review.tryRemember")}
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            className={`cards-review-result ${result?.isCorrect
                                                    ? "correct"
                                                    : result?.isAlmostCorrect
                                                        ? "almost"
                                                        : "wrong"
                                                }`}
                                        >
                                            <p className="cards-review-result-title">
                                                {getResultMessage()}
                                            </p>

                                            <div className="cards-review-answer-block">
                                                <p className="cards-review-label">
                                                    {getAnswerBlockTitle()}
                                                </p>

                                                <p className="cards-review-translation">
                                                    {reviewMode === "writing"
                                                        ? currentCard.text || t("review.noPhrase")
                                                        : result?.correctAnswer || t("review.noTranslation")}
                                                </p>

                                                {currentCard?.reading ? (
                                                    <p className="cards-review-extra">
                                                        <strong>{t("review.reading")}:</strong>{" "}
                                                        {currentCard.reading}
                                                    </p>
                                                ) : null}

                                                {currentCard?.pronunciation ? (
                                                    <p className="cards-review-pronunciation">
                                                        {currentCard.pronunciation}
                                                    </p>
                                                ) : null}

                                                {currentCard?.formality ? (
                                                    <p className="cards-review-extra">
                                                        <strong>{t("cards.formality")}:</strong>{" "}
                                                        {currentCard.formality}
                                                    </p>
                                                ) : null}

                                                {currentCard?.usage ? (
                                                    <p className="cards-review-extra">
                                                        <strong>{t("cards.whenToUse")}:</strong>{" "}
                                                        {currentCard.usage}
                                                    </p>
                                                ) : null}

                                                {currentCard?.withWhom ? (
                                                    <p className="cards-review-extra">
                                                        <strong>{t("cards.withWhom")}:</strong>{" "}
                                                        {currentCard.withWhom}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="cards-review-actions">
                            {!showResult ? (
                                <div className="cards-review-input-section">
                                    <input
                                        type="text"
                                        className="cards-review-input"
                                        placeholder={getInputPlaceholder()}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                    />

                                    <div className="cards-review-action-row">
                                        <button
                                            type="button"
                                            className="cards-review-secondary-btn"
                                            onClick={handleDontKnow}
                                        >
                                            {t("review.dontKnow")}
                                        </button>

                                        <button
                                            type="button"
                                            className="cards-review-primary-btn"
                                            onClick={handleCheck}
                                            disabled={!normalizeText(input)}
                                        >
                                            {t("review.check")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="cards-review-primary-btn large"
                                    onClick={handleNext}
                                >
                                    {t("review.next")}
                                </button>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
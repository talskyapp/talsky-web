import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Sparkles,
    Languages,
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
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?;:'"()]/g, "")
        .replace(/\s+/g, " ");
}

function getReviewMode(search) {
    const params = new URLSearchParams(search);
    const mode = params.get("mode");
    return mode === "writing" ? "writing" : "meaning";
}

function getWritingDifficulty(search) {
    const params = new URLSearchParams(search);
    const difficulty = params.get("difficulty");

    return ["easy", "medium", "hard"].includes(difficulty)
        ? difficulty
        : "easy";
}

function getTargetLanguageLabel(card, t) {
    return card?.language || t("cards.savedPhrase");
}

function renderComparedText(userText = "", correctText = "") {
    const user = String(userText).trim();
    const correct = String(correctText).trim();

    return user.split("").map((char, index) => {
        const isWrong =
            correct[index] &&
            char.toLowerCase() !== correct[index].toLowerCase();

        return (
            <span
                key={`${char}-${index}`}
                className={isWrong ? "review-char-wrong" : ""}
            >
                {char}
            </span>
        );
    });
}

function shuffleArray(items = []) {
    return [...items].sort(() => Math.random() - 0.5);
}

function buildExercisePool(cardCount = 0) {
    const basePool = [
        "write",
        "write",
        "write",
        "write",

        "translate",
        "translate",
        "translate",

        "complete",

        "order",
    ];

    const pool = [];

    while (pool.length < cardCount) {
        pool.push(...shuffleArray(basePool));
    }

    return pool.slice(0, cardCount);
}

function buildCompleteExercise(card) {
    const source = getWritingSource(card, card?.writingDifficulty || "easy");

    const chars = Array.from(String(source));

    const candidateIndexes = chars
        .map((char, index) => ({ char, index }))
        .filter(({ char }) => /[a-zA-Zぁ-んァ-ン一-龯]/.test(char));

    const hiddenItems = candidateIndexes
        .filter((_, index) => index % 3 === 1)
        .slice(0, 8);

    const hiddenIndexes = hiddenItems.map((item) => item.index);
    const letters = hiddenItems.map((item) => item.char);
    const distractorPool = candidateIndexes
        .map((item) => item.char)
        .filter((char) => !letters.includes(char));

    const distractors = shuffleArray(distractorPool).slice(0, 3);

    const keyboardLetters = shuffleArray([...letters, ...distractors]).map(
        (char, index) => ({
            id: `${char}-${index}-${Math.random()}`,
            char,
        })
    );

    const maskedChars = chars.map((char, index) =>
        hiddenIndexes.includes(index) ? "" : char
    );

    return {
        source,
        maskedChars,
        hiddenIndexes,
        letters: keyboardLetters,
    };
}

function buildOrderExercise(card) {
    const source = getWritingSource(card, card?.writingDifficulty || "easy");

    const words = String(source)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    const wordItems = shuffleArray(words).map((word, index) => ({
        id: `${word}-${index}-${Math.random()}`,
        word,
    }));

    return {
        source,
        words,
        wordItems,
    };
}

function getWritingExerciseType(card) {
    const text = getWritingSource(card, card?.writingDifficulty || "easy");

    if (!text || text === card?.translation) {
        return "write";
    }

    const words = String(text).trim().split(/\s+/).filter(Boolean);

    if (words.length >= 3) {
        const random = Math.random();

        if (random < 0.20) return "complete";
        if (random < 0.40) return "order";
        if (random < 0.65) return "translate";

        return "write";
    }

    if (String(text).length >= 6) {
        const random = Math.random();

        if (random < 0.25) return "complete";
        if (random < 0.50) return "translate";

        return "write";
    }

    return "write";
}

function getWritingSource(card, difficulty = "easy") {
    if (difficulty === "hard") {
        return card?.text || card?.reading || card?.pronunciation || "";
    }

    if (difficulty === "medium") {
        return card?.reading || card?.pronunciation || card?.text || "";
    }

    return card?.pronunciation || card?.reading || card?.text || "";
}

export default function CardsReviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const reviewMode = useMemo(() => getReviewMode(location.search), [location.search]);

    const writingDifficulty = useMemo(
        () => getWritingDifficulty(location.search),
        [location.search]
    );

    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [result, setResult] = useState(null);
    const [sessionFinished, setSessionFinished] = useState(false);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showScoreEmoji, setShowScoreEmoji] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [exerciseType, setExerciseType] = useState("write");
    const [completeExercise, setCompleteExercise] = useState(null);
    const [completeAnswers, setCompleteAnswers] = useState([]);
    const [orderExercise, setOrderExercise] = useState(null);
    const [orderAnswers, setOrderAnswers] = useState([]);
    const [exercisePool, setExercisePool] = useState([]);

    const currentItem = queue[currentIndex] || null;
    const currentCard = currentItem?.card || null;

    const progressPercent = useMemo(() => {
        if (!queue.length) return 0;
        return Math.round((answeredCount / queue.length) * 100);
    }, [answeredCount, queue.length]);

    const finalScorePercent = useMemo(() => {
        if (!answeredCount) return 0;
        return Math.round((correctCount / answeredCount) * 100);
    }, [correctCount, answeredCount]);

    const finalScoreMeta = useMemo(() => {

        if (finalScorePercent >= 80) {
            return {
                emoji: "😄",
                title: t("review.scoreGreatTitle"),
                text: t("review.scoreGreatText"),
            };
        }

        if (finalScorePercent >= 50) {
            return {
                emoji: "🙂",
                title: t("review.scoreGoodTitle"),
                text: t("review.scoreGoodText"),
            };
        }

        return {
            emoji: "😅",
            title: t("review.scoreTryTitle"),
            text: t("review.scoreTryText"),
        };
    }, [finalScorePercent, t]);

    useEffect(() => {
        if (!sessionFinished) return;

        setAnimatedScore(0);
        setShowScoreEmoji(false);

        let current = 0;

        const timer = setInterval(() => {
            current += 1;

            if (current >= finalScorePercent) {
                current = finalScorePercent;
                clearInterval(timer);

                setTimeout(() => {
                    setShowScoreEmoji(true);
                }, 250);
            }

            setAnimatedScore(current);
        }, 12);

        return () => clearInterval(timer);
    }, [sessionFinished, finalScorePercent]);

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
            const pool = buildExercisePool(safeQueue.length);
            setExercisePool(pool);
            setCurrentIndex(0);
            setInput("");
            setShowResult(false);
            setResult(null);
            setAnsweredCount(0);
            setCorrectCount(0);
            setSessionFinished(safeQueue.length === 0);
            if (safeQueue.length > 0) {
                prepareExerciseForCard(
                    safeQueue[0]?.card,
                    pool[0]
                );
            }
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

    const submitReviewResult = async ({ knewIt = false, answerOverride = null }) => {
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
                    answer: answerOverride ?? input,
                    knewIt,
                    mode: reviewMode,
                    difficulty: writingDifficulty,
                    exerciseType,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || t("review.failedSubmit"));
            }

            setResult(data);
            setShowResult(true);
            setAnsweredCount((prev) => prev + 1);
            if (data?.isCorrect) {
                setCorrectCount((prev) => prev + 1);
            }
        } catch (err) {
            console.error("Submit review error:", err);
            setError(err.message || t("review.failedSubmit"));
        }
    };

    const getPronunciationLabel = () => {
        const language = String(currentCard?.language || "").toLowerCase();

        if (language === "japanese") {
            return t("review.romaji");
        }

        if (language === "korean") {
            return t("review.romanization");
        }

        if (language === "chinese") {
            return t("review.pinyin");
        }

        return t("review.pronunciation");
    };

    const handleCompleteLetterPress = (letterItem) => {
        setCompleteAnswers((prev) => {
            const next = [...prev];
            const emptyIndex = next.findIndex((item) => !item);

            if (emptyIndex === -1) return prev;

            next[emptyIndex] = letterItem;
            return next;
        });
    };

    const handleCompleteSlotPress = (slotIndex) => {
        setCompleteAnswers((prev) => {
            const next = [...prev];

            if (!next[slotIndex]) return prev;

            next[slotIndex] = null;
            return next;
        });
    };

    const getCompleteAnswerText = () => {
        if (!completeExercise) return "";

        let hiddenCursor = 0;

        return completeExercise.maskedChars
            .map((char) => {
                if (char !== "") return char;

                const answerItem = completeAnswers[hiddenCursor] || null;
                hiddenCursor += 1;

                return answerItem?.char || "";
            })
            .join("");
    };

    const handleCheck = async () => {
        const finalAnswer =
            exerciseType === "complete"
                ? getCompleteAnswerText()
                : exerciseType === "order"
                    ? getOrderAnswerText()
                    : input;

        if (!normalizeText(finalAnswer)) return;

        setInput(finalAnswer);

        await submitReviewResult({
            knewIt: false,
            answerOverride: finalAnswer,
        });
    };

    const handleDontKnow = async () => {
        await submitReviewResult({ knewIt: true });
    };

    function prepareExerciseForCard(card, forcedType = null) {

        const cardWithDifficulty = {
            ...card,
            writingDifficulty,
        };

        const nextType =
            forcedType ||
            (
                reviewMode === "writing"
                    ? (exercisePool[currentIndex] || "write")
                    : "write"
            );

        setExerciseType(nextType);

        if (nextType === "complete") {
            const exercise = buildCompleteExercise(cardWithDifficulty);

            if (String(exercise.source).length < 6) {
                prepareExerciseForCard(card, "translate");
                return;
            }

            setCompleteExercise(exercise);
            setCompleteAnswers(
                Array(exercise.hiddenIndexes.length).fill(null)
            );

            setOrderExercise(null);
            setOrderAnswers([]);
        }
        else if (nextType === "order") {

            const exercise = buildOrderExercise(cardWithDifficulty);

            if (exercise.words.length < 2) {
                prepareExerciseForCard(card, "translate");
                return;
            }

            setOrderExercise(exercise);
            setOrderAnswers([]);

            setCompleteExercise(null);
            setCompleteAnswers([]);
        }
        else {

            setCompleteExercise(null);
            setCompleteAnswers([]);

            setOrderExercise(null);
            setOrderAnswers([]);
        }
    }

    const handleOrderWordPress = (wordItem) => {
        setOrderAnswers((prev) => [...prev, wordItem]);
    };

    const handleOrderAnswerPress = (wordId) => {
        setOrderAnswers((prev) =>
            prev.filter((item) => item.id !== wordId)
        );
    };

    const getOrderAnswerText = () => {
        return orderAnswers.map((item) => item.word).join(" ");
    };

    const handleNext = () => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
            setSessionFinished(true);
            return;
        }

        setShowDetails(false);
        setCurrentIndex(nextIndex);
        setInput("");
        setShowResult(false);
        setResult(null);
        prepareExerciseForCard(
            queue[nextIndex]?.card,
            exercisePool[nextIndex]
        );
    };

    const getResultMessage = () => {
        if (!result) return "";
        if (result.isCorrect) return t("review.correct");
        if (result.isAlmostCorrect) return t("review.almost");
        return t("review.wrong");
    };

    const getFrontText = () => {
        if (!currentCard) return "";

        if (reviewMode === "writing" && exerciseType === "translate") {
            return getWritingSource(
                {
                    ...currentCard,
                    writingDifficulty,
                },
                writingDifficulty
            );
        }

        return reviewMode === "writing"
            ? currentCard.translation || t("review.noTranslation")
            : currentCard.text;
    };

    const getInputPlaceholder = () => {
        const targetLanguage = getTargetLanguageLabel(currentCard, t);

        if (exerciseType === "translate") {
            return t("review.placeholderTranslation");
        }

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

            if (writingDifficulty === "hard") {
                return t("review.tryWriteJapaneseOnly");
            }

            if (writingDifficulty === "medium") {
                return t("review.tryWriteJapaneseOrRomaji");
            }

            return t("review.tryWriteJapanese");
        }

        return `${t("review.tryWriteIn")} ${targetLanguage}`;
    };


    return (
        <div className="cards-review-page">
            <div className="cards-review-shell">
                <section className="cards-review-hero">
                    <div className="cards-review-top-row">
                        <button
                            type="button"
                            className="cards-review-back-btn"
                            onClick={() => setShowExitModal(true)}
                        >
                            <ArrowLeft size={18} />
                            <span>{t("review.back")}</span>
                        </button>

                        <div className="cards-review-kicker">
                            <Sparkles size={14} />
                            <span>{getModeTitle()}</span>
                        </div>
                    </div>

                    <h1>{getModeTitle()}</h1>
                    <p>{getModeDescription()}</p>

                    <div className="cards-review-chip-row">
                        <div className="cards-review-mode-chip">
                            {getModeIcon()}
                            <span>{reviewMode === "writing" ? t("review.writingMode") : t("review.meaningMode")}</span>
                        </div>

                        {reviewMode === "writing" && (
                            <div className={`cards-review-chip-level ${writingDifficulty}`}>
                                {writingDifficulty === "easy" && "😊 Fácil"}
                                {writingDifficulty === "medium" && "😐 Medio"}
                                {writingDifficulty === "hard" && "🔥 Difícil"}
                            </div>
                        )}
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

                        {showScoreEmoji ? (
                            <div className="cards-review-score-emoji">
                                {finalScoreMeta.emoji}
                            </div>
                        ) : (
                            <div className="cards-review-score-placeholder" />
                        )}

                        <h2>{finalScoreMeta.title}</h2>

                        <div className="cards-review-score-number">
                            {animatedScore}%
                        </div>

                        <p>{finalScoreMeta.text}</p>

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
                                    {!showResult ? (
                                        <>
                                            <p className="cards-review-label">
                                                {exerciseType === "translate"
                                                    ? t("review.phrase")
                                                    : t("review.front")}
                                            </p>
                                            <h2>{getFrontText()}</h2>

                                        </>
                                    ) : (
                                        <>
                                            <p className="cards-review-label">{t("review.answer")}</p>
                                            <h2 className={!result?.isCorrect ? "cards-review-user-main-answer wrong" : ""}>
                                                {result?.isCorrect
                                                    ? input
                                                    : renderComparedText(
                                                        input,
                                                        currentCard.pronunciation ||
                                                        currentCard.reading ||
                                                        currentCard.text
                                                    )}
                                            </h2>
                                        </>
                                    )}
                                    {!showResult &&
                                        reviewMode === "writing" &&
                                        ["formal", "informal"].includes(
                                            String(currentCard?.formality || "").toLowerCase()
                                        ) ? (
                                        <p className="cards-review-formality-note">
                                            ({currentCard.formality})
                                        </p>
                                    ) : null}

                                    {!showResult ? (
                                        <div className="cards-review-hidden">
                                            <HelpCircle size={18} />
                                            <span>
                                                {exerciseType === "translate"
                                                    ? t("review.writeMeaning")
                                                    : exerciseType === "complete"
                                                        ? t("review.completeThePhrase")
                                                        : exerciseType === "order"
                                                            ? t("review.orderTheWords")
                                                            : reviewMode === "writing"
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

                                            <div className="cards-review-answer-block">
                                                <p
                                                    className={`cards-review-result-title ${result?.isCorrect
                                                        ? "correct"
                                                        : result?.isAlmostCorrect
                                                            ? "almost"
                                                            : "wrong"
                                                        }`}
                                                >
                                                    {getResultMessage()}
                                                </p>

                                                {currentCard?.reading ? (
                                                    <div className="cards-review-answer-line">
                                                        <span>{t("review.reading")}</span>
                                                        <strong>{currentCard.reading}</strong>
                                                    </div>
                                                ) : null}

                                                {currentCard?.pronunciation ? (
                                                    <div className="cards-review-answer-line">
                                                        <span>{getPronunciationLabel()}</span>
                                                        <strong>{currentCard.pronunciation}</strong>
                                                    </div>
                                                ) : null}

                                                {currentCard?.translation ? (
                                                    <div className="cards-review-answer-line">
                                                        <span>{t("review.meaning")}</span>
                                                        <strong>{currentCard.translation}</strong>
                                                    </div>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    className="cards-review-details-toggle"
                                                    onClick={() => setShowDetails((prev) => !prev)}
                                                >
                                                    {showDetails ? t("review.hideDetails") : t("review.moreDetails")}
                                                </button>

                                                {showDetails ? (
                                                    <div className="cards-review-details-panel">
                                                        <div className="cards-review-answer-line">
                                                            <span>{t("review.correctPhrase")}</span>
                                                            <strong>{currentCard.text || t("review.noPhrase")}</strong>
                                                        </div>

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
                                    {exerciseType === "complete" && completeExercise ? (
                                        <div className="cards-complete-exercise">
                                            <div className="cards-complete-mask">
                                                {completeExercise.maskedChars.map((char, index) => {
                                                    if (char !== "") {
                                                        return (
                                                            <span key={index} className="cards-complete-char">
                                                                {char}
                                                            </span>
                                                        );
                                                    }

                                                    const hiddenIndex = completeExercise.hiddenIndexes.indexOf(index);

                                                    return (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            className="cards-complete-slot"
                                                            onClick={() => handleCompleteSlotPress(hiddenIndex)}
                                                        >
                                                            {completeAnswers[hiddenIndex]?.char || ""}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="cards-complete-keyboard">
                                                {completeExercise.letters
                                                    .filter(
                                                        (letterItem) =>
                                                            !completeAnswers.some(
                                                                (answer) => answer?.id === letterItem.id
                                                            )
                                                    )
                                                    .map((letterItem) => (
                                                        <button
                                                            key={letterItem.id}
                                                            type="button"
                                                            className="cards-complete-key"
                                                            onClick={() => handleCompleteLetterPress(letterItem)}
                                                        >
                                                            {letterItem.char}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : exerciseType === "order" && orderExercise ? (
                                        <div className="cards-order-exercise">
                                            <div className="cards-order-answer">
                                                {orderExercise.words.map((_, index) => {
                                                    const item = orderAnswers[index];

                                                    return item ? (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            className="cards-order-answer-chip filled"
                                                            onClick={() => handleOrderAnswerPress(item.id)}
                                                        >
                                                            {item.word}
                                                        </button>
                                                    ) : (
                                                        <span
                                                            key={`empty-${index}`}
                                                            className="cards-order-answer-chip empty"
                                                        />
                                                    );
                                                })}
                                            </div>

                                            <div className="cards-order-bank">
                                                {orderExercise.wordItems
                                                    .filter(
                                                        (wordItem) =>
                                                            !orderAnswers.some(
                                                                (answer) => answer.id === wordItem.id
                                                            )
                                                    )
                                                    .map((wordItem) => (
                                                        <button
                                                            key={wordItem.id}
                                                            type="button"
                                                            className="cards-order-word"
                                                            onClick={() => handleOrderWordPress(wordItem)}
                                                        >
                                                            {wordItem.word}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="cards-review-input"
                                            placeholder={getInputPlaceholder()}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                        />
                                    )}

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
                                            disabled={
                                                exerciseType === "complete"
                                                    ? completeAnswers.some((item) => !item)
                                                    : exerciseType === "order"
                                                        ? orderAnswers.length !== orderExercise?.words?.length
                                                        : !normalizeText(input)
                                            }
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
            {showExitModal ? (
                <div className="review-exit-modal-backdrop">
                    <div className="review-exit-modal">
                        <h3>{t("review.exitTitle")}</h3>
                        <p>{t("review.exitText")}</p>

                        <div className="review-exit-modal-actions">
                            <button
                                type="button"
                                className="review-exit-cancel-btn"
                                onClick={() => setShowExitModal(false)}
                            >
                                {t("common.cancel")}
                            </button>

                            <button
                                type="button"
                                className="review-exit-confirm-btn"
                                onClick={() => navigate("/dashboard/cards")}
                            >
                                {t("common.accept")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
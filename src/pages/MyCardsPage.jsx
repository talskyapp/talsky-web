import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    Languages,
    Sparkles,
    Bookmark,
    RefreshCcw,
    HelpCircle,
    RotateCcw,
    BookOpen,
    PencilLine,
    Mic,
    Volume2,
} from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/MyCardsPage.css";

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

function formatLanguageLabel(language = "", t) {
    if (!language) return t("cards.savedPhrase");
    return language;
}

function getMasteryMeta(level = 0, t) {
    if (level === 3) {
        return {
            label: t("cards.levelStrong"),
            className: "level-3",
        };
    }

    if (level === 2) {
        return {
            label: t("cards.levelGrowing"),
            className: "level-2",
        };
    }

    if (level === 1) {
        return {
            label: t("cards.levelPractice"),
            className: "level-1",
        };
    }

    return {
        label: t("cards.levelNew"),
        className: "level-0",
    };
}

export default function MyCardsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [flippedCards, setFlippedCards] = useState({});
    const [playingCardId, setPlayingCardId] = useState("");

    const fetchCards = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = getAuthToken();

            const response = await fetch(`${API_URL}/api/vocabulary`, {
                method: "GET",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
            });

            const data = await response.json().catch(() => []);

            if (!response.ok) {
                throw new Error(data?.error || t("cards.failedToLoad"));
            }

            setCards(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch cards error:", err);
            setError(err.message || t("cards.failedToLoad"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    const filteredCards = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return cards;

        return cards.filter((card) => {
            const fields = [
                card.text,
                card.translation,
                card.pronunciation,
                card.language,
                card.formality,
                card.usage,
                card.withWhom,
            ];

            return fields.some((field) =>
                String(field || "").toLowerCase().includes(query)
            );
        });
    }, [cards, search]);

    const toggleFlip = (cardId) => {
        setFlippedCards((prev) => ({
            ...prev,
            [cardId]: !prev[cardId],
        }));
    };

    const goToReviewMode = (mode) => {
        navigate(`/dashboard/cards/review?mode=${encodeURIComponent(mode)}`);
    };

    const playCardAudio = async (card) => {
        try {
            if (!card?._id) return;

            setPlayingCardId(card._id);

            const token = getAuthToken();

            const response = await fetch(`${API_URL}/api/vocabulary/${card._id}/audio`, {
                method: "GET",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || t("cards.failedToLoadAudio"));
            }

            const audio = new Audio(`${API_URL}${data.audioUrl}`);
            audio.play().catch((err) => {
                console.error("Audio play error:", err);
            });

            audio.onended = () => {
                setPlayingCardId("");
            };
        } catch (err) {
            console.error("playCardAudio error:", err);
            setPlayingCardId("");
        }
    };

    return (
        <div className="my-cards-page">
            <div className="my-cards-shell">
                <section className="my-cards-hero">
                    <button
                        type="button"
                        className="my-cards-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={18} />
                        <span>{t("cards.back")}</span>
                    </button>

                    <div className="my-cards-hero-content">
                        <div className="my-cards-kicker">
                            <Sparkles size={14} />
                            <span>{t("cards.kicker")}</span>
                        </div>

                        <h1>{t("cards.title")}</h1>
                        <p>{t("cards.subtitle")}</p>

                        <div className="my-cards-stats">
                            <div className="my-cards-stat">
                                <strong>{cards.length}</strong>
                                <span>{t("cards.total")}</span>
                            </div>
                            <div className="my-cards-stat">
                                <strong>{filteredCards.length}</strong>
                                <span>{t("cards.showing")}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="my-cards-toolbar">
                    <div className="my-cards-search-wrap">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder={t("cards.search")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="my-cards-toolbar-actions">
                        <button
                            type="button"
                            className="my-cards-refresh-btn"
                            onClick={() => fetchCards(true)}
                            disabled={refreshing}
                        >
                            <RefreshCcw size={16} />
                            <span>{refreshing ? t("cards.refreshing") : t("cards.refresh")}</span>
                        </button>

                        <button
                            type="button"
                            className="my-cards-review-btn"
                            onClick={() => goToReviewMode("meaning")}
                            disabled={cards.length === 0}
                        >
                            <BookOpen size={16} />
                            <span>{t("cards.reviewMeaning")}</span>
                        </button>

                        <button
                            type="button"
                            className="my-cards-review-btn secondary"
                            onClick={() => goToReviewMode("writing")}
                            disabled={cards.length === 0}
                        >
                            <PencilLine size={16} />
                            <span>{t("cards.reviewWriting")}</span>
                        </button>

                        <button
                            type="button"
                            className="my-cards-review-btn ghost soon"
                            disabled
                            title={t("cards.comingSoon")}
                        >
                            <Mic size={16} />
                            <span>{t("cards.reviewPronunciation")}</span>
                            <em>{t("cards.soon")}</em>
                        </button>
                    </div>
                </section>

                {loading ? (
                    <div className="my-cards-state-card">
                        <p>{t("cards.loading")}</p>
                    </div>
                ) : error ? (
                    <div className="my-cards-state-card error">
                        <p>{error}</p>
                    </div>
                ) : filteredCards.length === 0 ? (
                    <div className="my-cards-empty">
                        <div className="my-cards-empty-icon">
                            <Bookmark size={28} />
                        </div>
                        <h2>{t("cards.emptyTitle")}</h2>
                        <p>{t("cards.emptyText")}</p>
                        <button
                            type="button"
                            className="my-cards-empty-btn"
                            onClick={() => navigate("/dashboard/ai-tutor")}
                        >
                            {t("cards.goToTutor")}
                        </button>
                    </div>
                ) : (
                    <section className="my-cards-grid">
                        {filteredCards.map((card) => {
                            const isFlipped = !!flippedCards[card._id];
                            const masteryLevel = card?.reviewStats?.masteryLevel ?? 0;
                            const masteryMeta = getMasteryMeta(masteryLevel, t);

                            return (
                                <article
                                    key={card._id}
                                    className={`my-card-item ${isFlipped ? "flipped" : ""}`}
                                >
                                    <div className="my-card-flip-inner">
                                        <div className="my-card-face front">
                                            <div className="my-card-top">
                                                <span className="my-card-badge">
                                                    <Languages size={13} />
                                                    {formatLanguageLabel(card.language, t)}
                                                </span>

                                                <div className="my-card-top-actions">
                                                    <button
                                                        type="button"
                                                        className="my-card-audio-btn"
                                                        onClick={() => playCardAudio(card)}
                                                        aria-label={t("cards.playAudio")}
                                                    >
                                                        <Volume2 size={16} />
                                                        <span>
                                                            {playingCardId === card._id
                                                                ? t("cards.playing")
                                                                : t("cards.play")}
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="my-card-help-btn"
                                                        onClick={() => toggleFlip(card._id)}
                                                        aria-label={t("cards.showUsageNotes")}
                                                    >
                                                        <HelpCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="my-card-level-row">
                                                <div
                                                    className={`my-card-level-bars ${masteryMeta.className}`}
                                                    title={masteryMeta.label}
                                                >
                                                    <span />
                                                    <span />
                                                    <span />
                                                    <span />
                                                </div>

                                                <span
                                                    className={`my-card-level-label ${masteryMeta.className}`}
                                                >
                                                    {masteryMeta.label}
                                                </span>
                                            </div>

                                            <div className="my-card-body">
                                                <h3>{card.text}</h3>

                                                {card.pronunciation ? (
                                                    <p className="my-card-pronunciation">
                                                        {card.pronunciation}
                                                    </p>
                                                ) : null}

                                                {card.translation ? (
                                                    <p className="my-card-translation">
                                                        {card.translation}
                                                    </p>
                                                ) : (
                                                    <p className="my-card-translation muted">
                                                        {t("cards.noTranslation")}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="my-card-footer">
                                                <span className="my-card-date">
                                                    {t("cards.saved")}{" "}
                                                    {new Date(card.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="my-card-face back">
                                            <div className="my-card-top">
                                                <span className="my-card-badge notes">
                                                    {t("cards.usageNotes")}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="my-card-help-btn"
                                                    onClick={() => toggleFlip(card._id)}
                                                    aria-label={t("cards.backToFront")}
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </div>

                                            <div className="my-card-level-row back-level">
                                                <div
                                                    className={`my-card-level-bars ${masteryMeta.className}`}
                                                    title={masteryMeta.label}
                                                >
                                                    <span />
                                                    <span />
                                                    <span />
                                                    <span />
                                                </div>

                                                <span
                                                    className={`my-card-level-label ${masteryMeta.className}`}
                                                >
                                                    {masteryMeta.label}
                                                </span>
                                            </div>

                                            <div className="my-card-notes">
                                                <div className="my-card-note-block">
                                                    <p className="my-card-note-label">
                                                        {t("cards.formality")}
                                                    </p>
                                                    <p className="my-card-note-value">
                                                        {card.formality || t("cards.notSpecified")}
                                                    </p>
                                                </div>

                                                <div className="my-card-note-block">
                                                    <p className="my-card-note-label">
                                                        {t("cards.whenToUse")}
                                                    </p>
                                                    <p className="my-card-note-value">
                                                        {card.usage || t("cards.notSpecified")}
                                                    </p>
                                                </div>

                                                <div className="my-card-note-block">
                                                    <p className="my-card-note-label">
                                                        {t("cards.withWhom")}
                                                    </p>
                                                    <p className="my-card-note-value">
                                                        {card.withWhom || t("cards.notSpecified")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </div>
    );
}
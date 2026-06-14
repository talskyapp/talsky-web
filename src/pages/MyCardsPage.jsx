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
import { JAPANESE_ALPHABET } from "../constants/japaneseAlphabet";
import { KOREAN_ALPHABET } from "../constants/koreanAlphabet";
import { CHINESE_PINYIN } from "../constants/chineseAlphabet";
import "../styles/MyCardsPage.css";


const DEFAULT_CARD_CATEGORIES = {
    greetings: { labelKey: "cards.categories.greetings", icon: "👋", image: "/categories/greetings.webp" },
    food: { labelKey: "cards.categories.food", icon: "🍜", image: "/categories/food.webp" },
    travel: { labelKey: "cards.categories.travel", icon: "✈️", image: "/categories/travel.webp" },
    questions: { labelKey: "cards.categories.questions", icon: "❓", image: "/categories/questions.webp" },
    animals: { labelKey: "cards.categories.animals", icon: "🐾", image: "/categories/animals.webp" },
    shopping: { labelKey: "cards.categories.shopping", icon: "🛍️", image: "/categories/shopping.webp" },
    preferences: { labelKey: "cards.categories.preferences", icon: "💜", image: "/categories/preferences.webp" },
    feelings: { labelKey: "cards.categories.feelings", icon: "😊", image: "/categories/feelings.webp" },
    general: { labelKey: "cards.categories.general", icon: "✨", image: "/categories/general.webp" },
    work: { labelKey: "cards.categories.work", icon: "💼", image: "/categories/work.webp" },
};


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
    const [showWritingDifficultyModal, setShowWritingDifficultyModal] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [flippedCards, setFlippedCards] = useState({});
    const [playingCardId, setPlayingCardId] = useState("");
    const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
    const [categoryPreferences, setCategoryPreferences] = useState({});
    const [uploadingCategoryKey, setUploadingCategoryKey] = useState("");
    const [viewMode, setViewMode] = useState("categories");
    const [revealedVocabulary, setRevealedVocabulary] = useState({});
    const [audioRate, setAudioRate] = useState(1);
    const [alphabetType, setAlphabetType] = useState("hiragana");
    const [koreanType, setKoreanType] = useState("vowels");
    const [chineseType, setChineseType] = useState("vowels");

    const goToWritingDifficulty = (difficulty) => {
        setShowWritingDifficultyModal(false);
        navigate(`/dashboard/cards/review?mode=writing&difficulty=${difficulty}`);
    };

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
        fetchCategoryPreferences();
    }, []);

    const fetchCategoryPreferences = async () => {
        try {
            const token = getAuthToken();

            const response = await fetch(`${API_URL}/api/vocabulary/categories/preferences`, {
                method: "GET",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
            });

            const data = await response.json().catch(() => []);

            if (!response.ok) return;

            const map = {};

            data.forEach((item) => {
                map[item.categoryKey] = item.customImageUrl;
            });

            setCategoryPreferences(map);
        } catch (error) {
            console.error("fetchCategoryPreferences error:", error);
        }
    };

    const handleCategoryImageUpload = async (categoryKey, file) => {
        if (!file) return;

        try {
            setUploadingCategoryKey(categoryKey);

            const token = getAuthToken();
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(
                `${API_URL}/api/vocabulary/categories/${categoryKey}/image`,
                {
                    method: "POST",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    credentials: "include",
                    body: formData,
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || "Failed to upload image");
            }

            setCategoryPreferences((prev) => ({
                ...prev,
                [categoryKey]: data.preference.customImageUrl,
            }));
        } catch (error) {
            console.error("handleCategoryImageUpload error:", error);
        } finally {
            setUploadingCategoryKey("");
        }
    };

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

    const groupedCards = useMemo(() => {
        return filteredCards.reduce((acc, card) => {
            const key = card.categoryKey || "general";

            if (!acc[key]) acc[key] = [];

            acc[key].push(card);

            return acc;
        }, {});
    }, [filteredCards]);

    const categoryEntries = useMemo(() => {
        return Object.entries(groupedCards).map(([categoryKey, categoryCards]) => {
            const category =
                DEFAULT_CARD_CATEGORIES[categoryKey] ||
                DEFAULT_CARD_CATEGORIES.general;

            return {
                categoryKey,
                category,
                cards: categoryCards,
            };
        });
    }, [groupedCards]);

    const vocabularyList = useMemo(() => {
        return [...filteredCards].sort((a, b) =>
            String(a.pronunciation || a.text || "").localeCompare(
                String(b.pronunciation || b.text || "")
            )
        );
    }, [filteredCards]);

    const selectedCategory = selectedCategoryKey
        ? categoryEntries.find((item) => item.categoryKey === selectedCategoryKey)
        : null;

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const learningLanguages = Array.isArray(currentUser?.languageToLearn)
        ? currentUser.languageToLearn
        : [currentUser?.languageToLearn || currentUser?.activeLearningLanguage || ""];

    const showAlphabetTab = learningLanguages.some((lang) =>
        ["japanese", "korean", "chinese"].includes(String(lang).toLowerCase())
    );

    const currentLearningLanguage =
        currentUser?.activeLearningLanguage ||
        learningLanguages[0] ||
        "";

    const normalizedLearningLanguage = String(currentLearningLanguage).toLowerCase();

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
            audio.playbackRate = audioRate;
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

    useEffect(() => {
        if (!showAlphabetTab && viewMode === "alphabet") {
            setViewMode("categories");
        }
    }, [showAlphabetTab, viewMode]);

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
                            onClick={() => setShowWritingDifficultyModal(true)}
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

                <div className="my-cards-view-tabs">
                    <button
                        type="button"
                        className={viewMode === "categories" ? "active" : ""}
                        onClick={() => setViewMode("categories")}
                    >
                        📚 {t("cards.categoriesTab")}
                    </button>

                    <button
                        type="button"
                        className={viewMode === "vocabulary" ? "active" : ""}
                        onClick={() => setViewMode("vocabulary")}
                    >
                        📖 {t("cards.vocabularyTab")}
                    </button>
                    {showAlphabetTab ? (
                        <button
                            type="button"
                            className={viewMode === "alphabet" ? "active" : ""}
                            onClick={() => setViewMode("alphabet")}
                        >
                            🔤 {t("cards.alphabetTab")}
                        </button>
                    ) : null}
                </div>

                {viewMode === "vocabulary" && (
                    <div className="my-cards-audio-speed">
                        <span>🔊</span>

                        <button
                            type="button"
                            className={audioRate === 0.75 ? "active" : ""}
                            onClick={() => setAudioRate(0.75)}
                        >
                            0.75x
                        </button>

                        <button
                            type="button"
                            className={audioRate === 1 ? "active" : ""}
                            onClick={() => setAudioRate(1)}
                        >
                            1x
                        </button>

                        <button
                            type="button"
                            className={audioRate === 1.25 ? "active" : ""}
                            onClick={() => setAudioRate(1.25)}
                        >
                            1.25x
                        </button>
                    </div>
                )}

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
                    <div className="my-cards-library">
                        {viewMode === "alphabet" ? (
                            <div className="my-cards-alphabet-panel">
                                {normalizedLearningLanguage === "japanese" ? (
                                    <>
                                        <div className="alphabet-type-switch">
                                            <button
                                                className={alphabetType === "hiragana" ? "active" : ""}
                                                onClick={() => setAlphabetType("hiragana")}
                                            >
                                                Hiragana
                                            </button>

                                            <button
                                                className={alphabetType === "katakana" ? "active" : ""}
                                                onClick={() => setAlphabetType("katakana")}
                                            >
                                                Katakana
                                            </button>

                                            <button
                                                className={alphabetType === "dakuten" ? "active" : ""}
                                                onClick={() => setAlphabetType("dakuten")}
                                            >
                                                Dakuten
                                            </button>

                                            <button
                                                className={alphabetType === "handakuten" ? "active" : ""}
                                                onClick={() => setAlphabetType("handakuten")}
                                            >
                                                Handakuten
                                            </button>
                                            <button
                                                className={alphabetType === "combinations" ? "active" : ""}
                                                onClick={() => setAlphabetType("combinations")}
                                            >
                                                Combinations
                                            </button>
                                        </div>
                                        <div className="my-cards-alphabet-header">
                                            <div className="my-cards-alphabet-title-row">
                                                <h2>
                                                    {alphabetType === "hiragana" && t("alphabet.hiraganaTitle")}
                                                    {alphabetType === "katakana" && t("alphabet.katakanaTitle")}
                                                    {alphabetType === "dakuten" && t("alphabet.dakutenTitle")}
                                                    {alphabetType === "handakuten" && t("alphabet.handakutenTitle")}
                                                    {alphabetType === "combinations" && t("alphabet.combinationsTitle")}
                                                </h2>

                                            </div>

                                            <p>
                                                {alphabetType === "hiragana" && t("alphabet.hiraganaDescription")}
                                                {alphabetType === "katakana" && t("alphabet.katakanaDescription")}
                                                {alphabetType === "dakuten" && t("alphabet.dakutenDescription")}
                                                {alphabetType === "handakuten" && t("alphabet.handakutenDescription")}
                                                {alphabetType === "combinations" && t("alphabet.combinationsDescription")}
                                            </p>
                                        </div>

                                        <div className="my-cards-kana-grid">
                                            {JAPANESE_ALPHABET[alphabetType].flatMap((row, rowIndex) =>
                                                row.map((item, itemIndex) =>
                                                    item ? (
                                                        <button
                                                            key={`${item.kana}-${rowIndex}-${itemIndex}`}
                                                            type="button"
                                                            className={`my-cards-kana-cell group-${rowIndex}`}
                                                        >
                                                            <strong>{item.kana}</strong>
                                                            <span>{item.romaji}</span>
                                                        </button>
                                                    ) : (
                                                        <span
                                                            key={`empty-${rowIndex}-${itemIndex}`}
                                                            className="my-cards-kana-cell empty"
                                                        />
                                                    )
                                                )
                                            )}
                                        </div>
                                    </>
                                ) : normalizedLearningLanguage === "korean" ? (
                                    <>
                                        <div className="alphabet-type-switch">
                                            <button
                                                className={koreanType === "vowels" ? "active" : ""}
                                                onClick={() => setKoreanType("vowels")}
                                            >
                                                {t("alphabet.koreanVowels")}
                                            </button>

                                            <button
                                                className={koreanType === "consonants" ? "active" : ""}
                                                onClick={() => setKoreanType("consonants")}
                                            >
                                                {t("alphabet.koreanConsonants")}
                                            </button>

                                            <button
                                                className={koreanType === "doubleConsonants" ? "active" : ""}
                                                onClick={() => setKoreanType("doubleConsonants")}
                                            >
                                                {t("alphabet.koreanDoubleConsonants")}
                                            </button>

                                            <button
                                                className={koreanType === "compoundVowels" ? "active" : ""}
                                                onClick={() => setKoreanType("compoundVowels")}
                                            >
                                                {t("alphabet.koreanCompoundVowels")}
                                            </button>
                                        </div>

                                        <div className="my-cards-alphabet-header">
                                            <h2>{t(`alphabet.${koreanType}`)}</h2>
                                            <p>{t(`alphabet.${koreanType}Description`)}</p>
                                        </div>

                                        <div className="my-cards-kana-grid">
                                            {KOREAN_ALPHABET[koreanType].map(([letter, romanization], index) => (
                                                <button
                                                    key={`${letter}-${index}`}
                                                    type="button"
                                                    className={`my-cards-kana-cell group-${index % 8}`}
                                                >
                                                    <strong>{letter}</strong>
                                                    <span>{romanization}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : normalizedLearningLanguage === "chinese" ? (
                                    <>
                                        <div className="alphabet-type-switch">
                                            <button
                                                className={chineseType === "vowels" ? "active" : ""}
                                                onClick={() => setChineseType("vowels")}
                                            >
                                                {t("alphabet.chineseVowels")}
                                            </button>

                                            <button
                                                className={chineseType === "initials" ? "active" : ""}
                                                onClick={() => setChineseType("initials")}
                                            >
                                                {t("alphabet.chineseInitials")}
                                            </button>

                                            <button
                                                className={chineseType === "advancedInitials" ? "active" : ""}
                                                onClick={() => setChineseType("advancedInitials")}
                                            >
                                                {t("alphabet.chineseAdvancedInitials")}
                                            </button>

                                            <button
                                                className={chineseType === "tones" ? "active" : ""}
                                                onClick={() => setChineseType("tones")}
                                            >
                                                {t("alphabet.chineseTones")}
                                            </button>
                                        </div>

                                        <div className="my-cards-alphabet-header">
                                            <h2>{t(`alphabet.${chineseType}`)}</h2>
                                            <p>{t(`alphabet.${chineseType}Description`)}</p>
                                        </div>

                                        <div className="my-cards-kana-grid">
                                            {CHINESE_PINYIN[chineseType].map(([symbol, value], index) => (
                                                <button
                                                    key={`${symbol}-${index}`}
                                                    type="button"
                                                    className={`my-cards-kana-cell group-${index % 8}`}
                                                >
                                                    <strong>{symbol}</strong>
                                                    <span>{value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="my-cards-state-card">
                                        <p>{t("alphabet.notAvailable")}</p>
                                    </div>
                                )}
                            </div>
                        ) : viewMode === "vocabulary" ? (
                            <div className="my-cards-vocabulary-list">

                                {vocabularyList.map((card) => {
                                    const isRevealed = !!revealedVocabulary[card._id];

                                    return (
                                        <div
                                            key={card._id}
                                            className="my-cards-vocabulary-row"
                                        >
                                            <div className="my-cards-vocabulary-content">
                                                <strong>{card.text}</strong>

                                                {card.pronunciation ? (
                                                    <span>{card.pronunciation}</span>
                                                ) : null}

                                                {card.phoneticHint ? (
                                                    <small>{card.phoneticHint}</small>
                                                ) : null}
                                            </div>

                                            <div className="my-cards-vocabulary-actions">
                                                <button
                                                    type="button"
                                                    className="my-cards-vocabulary-audio"
                                                    onClick={() => playCardAudio(card)}
                                                    title={t("cards.playAudio")}
                                                >
                                                    <Volume2 size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="my-cards-vocabulary-help"
                                                    onClick={() =>
                                                        setRevealedVocabulary((prev) => ({
                                                            ...prev,
                                                            [card._id]: !prev[card._id],
                                                        }))
                                                    }
                                                >
                                                    ?
                                                </button>
                                            </div>

                                            {isRevealed ? (
                                                <p className="my-cards-vocabulary-translation">
                                                    {card.translation}
                                                </p>
                                            ) : null}
                                        </div>
                                    );
                                })}

                            </div>
                        ) : !selectedCategory ? (
                            <div className="my-cards-category-gallery">
                                {categoryEntries.map(({ categoryKey, category, cards }) => (
                                    <button
                                        key={categoryKey}
                                        type="button"
                                        className="my-cards-category-cover"
                                        onClick={() => setSelectedCategoryKey(categoryKey)}
                                    >
                                        <div
                                            className="my-cards-category-cover-image"
                                            style={{
                                                backgroundImage: `url(${categoryPreferences[categoryKey]
                                                    ? `${API_URL}${categoryPreferences[categoryKey]}`
                                                    : category.image
                                                    })`,
                                            }}
                                        >
                                            <div className="my-cards-category-cover-overlay" />

                                            <span className="my-cards-category-cover-icon">
                                                {category.icon}
                                            </span>
                                        </div>

                                        <div className="my-cards-category-cover-body">
                                            <h2>{t(category.labelKey)}</h2>
                                            <p>{t("cards.savedExpressionsCount", { count: cards.length })}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <section className="my-cards-category-detail">
                                <button
                                    type="button"
                                    className="my-cards-category-back"
                                    onClick={() => setSelectedCategoryKey("")}
                                >
                                    <ArrowLeft size={16} />
                                    <span>{t("cards.backToCategories")}</span>
                                </button>

                                <div
                                    className="my-cards-category-hero"
                                    style={{
                                        backgroundImage: `url(${categoryPreferences[selectedCategory.categoryKey]
                                            ? `${API_URL}${categoryPreferences[selectedCategory.categoryKey]}`
                                            : selectedCategory.category.image
                                            })`,
                                    }}
                                >
                                    <div className="my-cards-category-hero-overlay" />

                                    <div className="my-cards-category-hero-content">
                                        <span className="my-cards-category-cover-icon large">
                                            {selectedCategory.category.icon}
                                        </span>

                                        <div>
                                            <h2>{t(selectedCategory.category.labelKey)}</h2>
                                            <p>
                                                {t("cards.savedExpressionsCount", {
                                                    count: selectedCategory.cards.length,
                                                })}
                                            </p>
                                            <label className="my-cards-upload-cover-btn">
                                                {uploadingCategoryKey === selectedCategory.categoryKey
                                                    ? t("cards.uploadingCover")
                                                    : t("cards.changeCover")}

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    onChange={(e) =>
                                                        handleCategoryImageUpload(
                                                            selectedCategory.categoryKey,
                                                            e.target.files?.[0]
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="my-cards-grid">
                                    {selectedCategory.cards.map((card) => {
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

                                                            {card.phoneticHint && card.phoneticHint !== card.pronunciation ? (
                                                                <p className="my-card-phonetic">
                                                                    🗣️ {card.phoneticHint}
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
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
            {showWritingDifficultyModal ? (
                <div className="writing-difficulty-backdrop">
                    <div className="writing-difficulty-modal">
                        <h3>{t("cards.chooseWritingLevel")}</h3>
                        <p>{t("cards.chooseWritingLevelText")}</p>

                        <div className="writing-difficulty-options">
                            <button
                                type="button"
                                onClick={() => goToWritingDifficulty("easy")}
                            >
                                <strong>😊 {t("cards.easy")}</strong>
                                <span>{t("cards.easyText")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => goToWritingDifficulty("medium")}
                            >
                                <strong>😐 {t("cards.medium")}</strong>
                                <span>{t("cards.mediumText")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => goToWritingDifficulty("hard")}
                            >
                                <strong>🔥 {t("cards.hard")}</strong>
                                <span>{t("cards.hardText")}</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            className="writing-difficulty-cancel"
                            onClick={() => setShowWritingDifficultyModal(false)}
                        >
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>

    );
}
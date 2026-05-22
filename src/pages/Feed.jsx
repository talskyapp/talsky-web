import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { API_URL } from "../lib/config";
import { getImageUrl } from "../utils/getImageUrl.js";
import { useTranslation } from "../hooks/useTranslation";
import IdealMatchFloatingCard from "../components/IdealMatchFloatingCard";
import "../styles/Feed.css";

const PAGE_SIZE = 20;

const getDefaultFilters = (currentUser) => ({
    locationScope: "worldwide",
    country: currentUser?.location?.country || "",
    city: currentUser?.location?.city || "",
    languages: [],
    ageRange: 99,
    gender: "all",
    memberType: "all",
});

const shuffleArray = (arr) => {
    const copy = [...arr];

    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
};

export default function Feed() {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [customLanguage, setCustomLanguage] = useState("");
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const [appliedFilters, setAppliedFilters] = useState(() => getDefaultFilters(user));
    const [draftFilters, setDraftFilters] = useState(() => getDefaultFilters(user));

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState("");

    const token = localStorage.getItem("token");
    const languageBoxRef = useRef(null);

    const [idealMatch, setIdealMatch] = useState(null);
    const [loadingMatch, setLoadingMatch] = useState(true);
    const [showIdealMatchPrompt, setShowIdealMatchPrompt] = useState(false);

    const allLanguages = [
        "Arabic",
        "Bengali",
        "Chinese",
        "Dutch",
        "English",
        "French",
        "German",
        "Greek",
        "Hebrew",
        "Hindi",
        "Indonesian",
        "Italian",
        "Japanese",
        "Korean",
        "Polish",
        "Portuguese",
        "Russian",
        "Spanish",
        "Thai",
        "Turkish",
        "Ukrainian",
        "Urdu",
        "Vietnamese",
    ];

    const suggestedLanguages = [
        "English",
        "Spanish",
        "French",
        "Portuguese",
        "Italian",
        "German",
        "Japanese",
        "Korean",
    ];

    const isPro =
        user?.subscription?.plan === "pro" &&
        user?.subscription?.status === "active";

    const normalizeText = (value) =>
        String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/,/g, "")
            .replace(/\s+/g, " ")
            .trim();

    const normalizeToArray = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => normalizeText(item)).filter(Boolean);
        }

        if (!value) return [];
        return [normalizeText(value)].filter(Boolean);
    };

    const getCity = (obj) => normalizeText(obj?.location?.city);
    const getCountry = (obj) => normalizeText(obj?.location?.country);

    const sameCity = (a, b) => {
        const cityA = getCity(a);
        const cityB = getCity(b);

        if (!cityA || !cityB) return false;
        return cityA === cityB;
    };

    const isSearching = searchQuery.trim().length > 0;

    const fetchFeedPage = async (pageToLoad = 1, replace = false) => {
        try {
            const res = await fetch(
                `${API_URL}/api/users/feed?page=${pageToLoad}&limit=${PAGE_SIZE}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            const rawIncomingUsers = Array.isArray(data?.users)
                ? data.users
                : Array.isArray(data)
                    ? data
                    : [];

            const incomingUsers = shuffleArray(rawIncomingUsers);

            setUsers((prev) => {
                if (replace) return incomingUsers;

                const existingIds = new Set(prev.map((u) => u._id));
                const uniqueIncoming = incomingUsers.filter((u) => !existingIds.has(u._id));
                return [...prev, ...uniqueIncoming];
            });

            if (typeof data?.hasMore === "boolean") {
                setHasMore(data.hasMore);
            } else {
                setHasMore(rawIncomingUsers.length === PAGE_SIZE);
            }

            setPage(pageToLoad);
        } catch (error) {
            console.error("Feed fetch error:", error);
            if (replace) setUsers([]);
            setHasMore(false);
        }
    };

    const searchUsersGlobally = async (query) => {
        try {
            setSearchLoading(true);

            const res = await fetch(
                `${API_URL}/api/users/search?q=${encodeURIComponent(query)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();
            const incoming = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];

            setSearchResults(incoming);
        } catch (error) {
            console.error("Global search error:", error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;

        const loadInitial = async () => {
            setLoading(true);
            try {
                if (!ignore) {
                    await fetchFeedPage(1, true);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadInitial();

        return () => {
            ignore = true;
        };
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const fetchIdealMatch = async () => {
            try {
                setLoadingMatch(true);

                const res = await fetch(`${API_URL}/api/matches/ideal-partner`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();

                if (res.ok && data?.match) {
                    setIdealMatch(data.match);
                } else {
                    setIdealMatch(null);
                }
            } catch (err) {
                console.error("Ideal match error:", err);
                setIdealMatch(null);
            } finally {
                setLoadingMatch(false);
            }
        };

        fetchIdealMatch();
    }, [token, API_URL]);

    useEffect(() => {
        if (!token) return;

        const sendIdealMatchNotification = async () => {
            try {
                await fetch(`${API_URL}/api/notifications/ideal-match`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (err) {
                console.error("Ideal match notification error:", err);
            }
        };

        sendIdealMatchNotification();
    }, [token]);

    useEffect(() => {
        if (loadingMatch || !idealMatch?.user?._id) return;

        const storageKey = "talsky_ideal_match_prompt";
        const raw = localStorage.getItem(storageKey);

        let saved = null;
        try {
            saved = raw ? JSON.parse(raw) : null;
        } catch {
            saved = null;
        }

        const now = Date.now();
        const isProUser =
            user?.subscription?.plan === "pro" &&
            (user?.subscription?.status === "active" ||
                user?.subscription?.status === "trialing");

        const displayIntervalMs = isProUser
            ? 1000 * 60 * 60 * 24 * 3   // 3 days  Pro
            : 1000 * 60 * 60 * 24 * 7;  // 7 days Free

        const lastShownAt = saved?.shownAt ? new Date(saved.shownAt).getTime() : 0;
        const lastMatchId = saved?.matchId || null;
        const lastScore = Number(saved?.score || 0);

        const isDifferentMatch = lastMatchId !== idealMatch.user._id;
        const isBetterMatch = Number(idealMatch.score || 0) > lastScore;
        const enoughTimePassed = !lastShownAt || now - lastShownAt >= displayIntervalMs;

        if (isDifferentMatch || isBetterMatch || enoughTimePassed) {
            setShowIdealMatchPrompt(true);

            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    matchId: idealMatch.user._id,
                    shownAt: new Date().toISOString(),
                    score: idealMatch.score || 0,
                    plan: isProUser ? "pro" : "free",
                })
            );
        }
    }, [idealMatch, loadingMatch]);

    useEffect(() => {
        const q = searchQuery.trim();

        if (!q) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const timer = setTimeout(() => {
            searchUsersGlobally(q);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, token]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!languageBoxRef.current?.contains(e.target)) {
                setShowLanguageDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setAppliedFilters(getDefaultFilters(user));
        setDraftFilters(getDefaultFilters(user));
    }, [user]);

    const closeFilters = () => {
        setDraftFilters(appliedFilters);
        setCustomLanguage("");
        setShowLanguageDropdown(false);
        setIsFiltersOpen(false);
    };

    const toggleLanguage = (lang) => {
        setDraftFilters((prev) => {
            const normalized = lang.trim();
            const exists = prev.languages.some(
                (item) => item.toLowerCase() === normalized.toLowerCase()
            );

            return {
                ...prev,
                languages: exists
                    ? prev.languages.filter(
                        (item) => item.toLowerCase() !== normalized.toLowerCase()
                    )
                    : [...prev.languages, normalized],
            };
        });
    };

    const handleSelectLanguage = (lang) => {
        const exists = draftFilters.languages.some(
            (item) => item.toLowerCase() === lang.toLowerCase()
        );

        if (!exists) {
            setDraftFilters((prev) => ({
                ...prev,
                languages: [...prev.languages, lang],
            }));
        }

        setCustomLanguage("");
        setShowLanguageDropdown(false);
    };

    const handleRemoveLanguage = (langToRemove) => {
        setDraftFilters((prev) => ({
            ...prev,
            languages: prev.languages.filter(
                (lang) => lang.toLowerCase() !== langToRemove.toLowerCase()
            ),
        }));
    };

    const handleCancelFilters = () => {
        closeFilters();
    };

    const getVipFilterUsage = (currentFilters) => {
        const vipReasons = [];

        if (currentFilters.locationScope === "country") {
            vipReasons.push(t("feed.filters.country"));
        }

        if (currentFilters.locationScope === "city") {
            vipReasons.push(t("feed.filters.city"));
        }

        if (Array.isArray(currentFilters.languages) && currentFilters.languages.length > 0) {
            vipReasons.push(t("feed.filters.languages"));
        }

        if (Number(currentFilters.ageRange) < 99) {
            vipReasons.push(t("feed.filters.age"));
        }

        if (currentFilters.gender !== "all") {
            vipReasons.push(t("feed.filters.gender"));
        }

        return vipReasons;
    };

    const handleApplyFilters = () => {
        const vipReasons = getVipFilterUsage(draftFilters);

        if (!isPro && vipReasons.length > 0) {
            setUpgradeReason(vipReasons.join(" · "));
            setShowUpgradeModal(true);
            return;
        }

        setAppliedFilters(draftFilters);
        setIsFiltersOpen(false);
    };

    const getAgeFromBirthday = (birthday) => {
        if (!birthday) return null;

        const birthDate = new Date(birthday);
        if (Number.isNaN(birthDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();

        const hasHadBirthdayThisYear =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
                today.getDate() >= birthDate.getDate());

        if (!hasHadBirthdayThisYear) age -= 1;

        return age;
    };

    const handleAllClick = () => {
        setActiveTab("all");
    };

    const handleNearbyClick = () => {
        setActiveTab("nearby");

        if (user?.locationPermission !== true) {
            navigate("/dashboard/nearby-permission");
            return;
        }

        if (!user?.location?.lat || !user?.location?.lng) {
            navigate("/dashboard/update-location");
            return;
        }

        navigate("/dashboard/nearby-map");
    };

    const handleLoadMore = async () => {
        if (isSearching || loadingMore || loading || !hasMore) return;

        setLoadingMore(true);
        try {
            await fetchFeedPage(page + 1, false);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleCloseIdealMatch = () => {
        setShowIdealMatchPrompt(false);

        if (idealMatch?.user?._id) {
            localStorage.setItem(
                "talsky_ideal_match_prompt",
                JSON.stringify({
                    matchId: idealMatch.user._id,
                    shownAt: new Date().toISOString(),
                    score: idealMatch.score || 0,
                })
            );
        }
    };

    const filteredLanguageOptions = useMemo(() => {
        const query = normalizeText(customLanguage);

        return allLanguages
            .filter((lang) => {
                const alreadySelected = draftFilters.languages.some(
                    (selected) => selected.toLowerCase() === lang.toLowerCase()
                );

                if (alreadySelected) return false;
                if (!query) return true;

                return normalizeText(lang).includes(query);
            })
            .slice(0, 8);
    }, [customLanguage, draftFilters.languages]);

    const baseUsers = useMemo(() => {
        return isSearching ? searchResults : users;
    }, [isSearching, searchResults, users]);

    const filteredUsers = useMemo(() => {
        const myNativeLanguage = normalizeText(user?.nativeLanguage);

        return baseUsers.filter((u) => {
            if (u._id === user?._id) return false;



            const selectedLanguages = normalizeToArray(appliedFilters.languages);
            const userNative = normalizeToArray(u.nativeLanguage);
            const userFluent = normalizeToArray(u.fluentLanguages);
            const userLearning = normalizeToArray(u.languageToLearn);

            const matchesSelectedLanguage =
                selectedLanguages.length === 0 ||
                selectedLanguages.some(
                    (selectedLang) =>
                        userNative.includes(selectedLang) ||
                        userFluent.includes(selectedLang) ||
                        userLearning.includes(selectedLang)
                );

            const isLearningMyNative =
                !myNativeLanguage || userLearning.includes(myNativeLanguage);

            const matchesLanguages =
                isLearningMyNative &&
                (selectedLanguages.length === 0 || matchesSelectedLanguage);

            const matchesGender =
                appliedFilters.gender === "all" ||
                normalizeText(u.gender) === normalizeText(appliedFilters.gender);

            const age = getAgeFromBirthday(u.birthday);
            const matchesAge =
                age == null ||
                (age >= 18 && age <= Number(appliedFilters.ageRange));

            const matchesMemberType =
                appliedFilters.memberType === "all" ||
                (appliedFilters.memberType === "new" && u.isNewMember === true);

            const matchesLocation =
                appliedFilters.locationScope === "worldwide" ||
                (appliedFilters.locationScope === "country" &&
                    getCountry(u) === getCountry(user)) ||
                (appliedFilters.locationScope === "city" &&
                    sameCity(u, user));

            return (
                matchesLanguages &&
                matchesGender &&
                matchesAge &&
                matchesMemberType &&
                matchesLocation
            );
        });
    }, [baseUsers, appliedFilters, user]);

    const countryToCode = {
        "United States": "US",
        "Mexico": "MX",
        "Spain": "ES",
        "France": "FR",
        "Italy": "IT",
        "Germany": "DE",
        "Japan": "JP",
        "South Korea": "KR",
        "Brazil": "BR",
        "Argentina": "AR",
    };

    const getFlagEmoji = (country) => {
        const code = countryToCode[country];
        if (!code) return "🌍";

        return code
            .toUpperCase()
            .replace(/./g, (char) =>
                String.fromCodePoint(127397 + char.charCodeAt())
            );
    };

    return (
        <>
            {showIdealMatchPrompt && idealMatch && (
                <IdealMatchFloatingCard
                    match={idealMatch}
                    onClose={handleCloseIdealMatch}
                />
            )}
            <div className="feed-page">
                <div className="feed-header">
                    <div className="feed-header-text">
                        <p className="feed-kicker">{t("feed.kicker")}</p>
                        <h1>{t("feed.title")}</h1>
                        <p className="feed-subtitle">
                            {t("feed.subtitle")}
                        </p>
                    </div>

                    <input
                        type="text"
                        className="feed-search"
                        placeholder={t("feed.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="feed-toolbar">
                    <div className="feed-tabs-wrap">
                        <div className="feed-tabs">
                            <button
                                type="button"
                                className={activeTab === "all" ? "active" : ""}
                                onClick={handleAllClick}
                            >
                                {t("feed.tabs.all")}
                            </button>

                            <button
                                type="button"
                                className={activeTab === "nearby" ? "active" : ""}
                                onClick={handleNearbyClick}
                            >
                                {t("feed.tabs.nearby")}
                            </button>
                        </div>
                    </div>

                    <button
                        className="feed-filter-btn"
                        onClick={() => {
                            if (!isFiltersOpen) {
                                setDraftFilters(appliedFilters);
                            }
                            setIsFiltersOpen((prev) => !prev);
                        }}
                        type="button"
                    >
                        <span className="filter-icon">⚙</span>
                        {t("feed.filters.button")}
                    </button>
                </div>

                {(loading && !isSearching) || searchLoading ? (
                    <div className="feed-empty">
                        {isSearching ? t("feed.states.searching") : t("feed.states.loading")}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="feed-empty">
                        {isSearching ? t("feed.states.noUsersFound") : t("feed.states.noPeopleFound")}
                    </div>
                ) : (
                    <>
                        <div className="feed-grid">
                            {filteredUsers.map((u) => (
                                <div
                                    key={u._id}
                                    className="feed-card"
                                    onClick={() => navigate(`/dashboard/profile/${u._id}`)}
                                >
                                    <div className="feed-card-top">
                                        <img
                                            src={getImageUrl(u.photo)}
                                            className="feed-avatar"
                                            alt={u.name || "User"}
                                        />

                                        <div className="feed-card-info">
                                            <h3 className="feed-name">{u.name}</h3>
                                            <p className="feed-location">
                                                {getFlagEmoji(u.location?.country)}{" "}
                                                {u.location?.country || t("feed.unknown")}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="bio">
                                        {u.bio?.trim()
                                            ? u.bio.slice(0, 90) + (u.bio.length > 90 ? "..." : "")
                                            : t("feed.openProfile")}
                                    </p>

                                    <div className="feed-tags">
                                        <span>
                                            {t("feed.native")} <strong>{u.nativeLanguage || "—"}</strong>
                                        </span>

                                        <span>
                                            {t("feed.learning")}{" "}
                                            <strong>
                                                {Array.isArray(u.languageToLearn)
                                                    ? u.languageToLearn.join(", ")
                                                    : u.languageToLearn || "—"}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!isSearching && hasMore && (
                            <div className="feed-load-more-wrap">
                                <button
                                    className="feed-load-more-btn"
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? t("feed.loadMore.loading") : t("feed.loadMore.button")}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {isFiltersOpen && (
                    <div className="filters-overlay" onClick={closeFilters}>
                        <div
                            className="filters-panel"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="filters-header">
                                <div>
                                    <p className="filters-kicker">{t("feed.filters.kicker")}</p>
                                    <h3>{t("feed.filters.title")}</h3>
                                </div>

                                <button
                                    className="filters-close"
                                    onClick={closeFilters}
                                    type="button"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="filters-section">
                                <label className="filters-label">{t("feed.filters.membersFrom")}</label>

                                <div className="filters-chip-group">
                                    <button
                                        type="button"
                                        className={draftFilters.locationScope === "worldwide" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({
                                                ...prev,
                                                locationScope: "worldwide",
                                            }))
                                        }
                                    >
                                        {t("feed.filters.worldwide")}
                                    </button>

                                    <button
                                        type="button"
                                        className={draftFilters.locationScope === "country" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({
                                                ...prev,
                                                locationScope: "country",
                                            }))
                                        }
                                    >
                                        {t("feed.filters.country")} <span className="vip-badge">VIP</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={draftFilters.locationScope === "city" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({
                                                ...prev,
                                                locationScope: "city",
                                            }))
                                        }
                                    >
                                        {t("feed.filters.city")} <span className="vip-badge">VIP</span>
                                    </button>
                                </div>
                            </div>

                            <div className="filters-section">
                                <div className="filters-row-title">
                                    <label className="filters-label">
                                        {t("feed.filters.languagesOfMembers")} <span className="vip-inline">VIP</span>
                                    </label>
                                </div>

                                <div className="filters-chip-group wrap">
                                    {suggestedLanguages.map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            className={
                                                draftFilters.languages.some(
                                                    (item) => item.toLowerCase() === lang.toLowerCase()
                                                )
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() => toggleLanguage(lang)}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>

                                <div className="filters-selected-languages">
                                    {draftFilters.languages.map((lang) => (
                                        <div key={lang} className="filters-selected-pill">
                                            <span>{lang}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLanguage(lang)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className="filters-add-language-row filters-language-autocomplete"
                                    ref={languageBoxRef}
                                >
                                    <input
                                        type="text"
                                        value={customLanguage}
                                        onChange={(e) => {
                                            setCustomLanguage(e.target.value);
                                            setShowLanguageDropdown(true);
                                        }}
                                        onFocus={() => setShowLanguageDropdown(true)}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                filteredLanguageOptions.length > 0
                                            ) {
                                                e.preventDefault();
                                                handleSelectLanguage(filteredLanguageOptions[0]);
                                            }
                                        }}
                                        placeholder={t("feed.filters.searchLanguage")}
                                        className="filters-input"
                                    />

                                    {showLanguageDropdown && (
                                        <div className="filters-language-dropdown">
                                            {filteredLanguageOptions.length > 0 ? (
                                                filteredLanguageOptions.map((lang) => (
                                                    <button
                                                        key={lang}
                                                        type="button"
                                                        className="filters-language-option"
                                                        onClick={() => handleSelectLanguage(lang)}
                                                    >
                                                        {lang}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="filters-language-empty">
                                                    {t("feed.filters.noLanguagesFound")}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="filters-section">
                                <div className="filters-age-head">
                                    <label className="filters-label">
                                        {t("feed.filters.age")} <span className="vip-inline">VIP</span>
                                    </label>
                                    <span>18 - {draftFilters.ageRange}</span>
                                </div>

                                <input
                                    type="range"
                                    min="18"
                                    max="99"
                                    value={draftFilters.ageRange}
                                    onChange={(e) =>
                                        setDraftFilters((prev) => ({
                                            ...prev,
                                            ageRange: Number(e.target.value),
                                        }))
                                    }
                                    className="filters-range"
                                />
                            </div>

                            <div className="filters-section">
                                <label className="filters-label">{t("feed.filters.gender")}</label>

                                <div className="filters-chip-group">
                                    <button
                                        type="button"
                                        className={draftFilters.gender === "all" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({ ...prev, gender: "all" }))
                                        }
                                    >
                                        {t("feed.filters.all")}
                                    </button>

                                    <button
                                        type="button"
                                        className={draftFilters.gender === "female" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({ ...prev, gender: "female" }))
                                        }
                                    >
                                        {t("feed.filters.woman")} <span className="vip-badge">VIP</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={draftFilters.gender === "male" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({ ...prev, gender: "male" }))
                                        }
                                    >
                                        {t("feed.filters.man")} <span className="vip-badge">VIP</span>
                                    </button>
                                </div>
                            </div>

                            <div className="filters-section">
                                <label className="filters-label">{t("feed.filters.members")}</label>

                                <div className="filters-chip-group">
                                    <button
                                        type="button"
                                        className={draftFilters.memberType === "all" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({ ...prev, memberType: "all" }))
                                        }
                                    >
                                        {t("feed.filters.allMembers")}
                                    </button>

                                    <button
                                        type="button"
                                        className={draftFilters.memberType === "new" ? "active" : ""}
                                        onClick={() =>
                                            setDraftFilters((prev) => ({ ...prev, memberType: "new" }))
                                        }
                                    >
                                        {t("feed.filters.newMembersOnly")}
                                    </button>
                                </div>
                            </div>

                            <div className="filters-actions">
                                <button
                                    className="filters-cancel"
                                    onClick={handleCancelFilters}
                                    type="button"
                                >
                                    {t("feed.filters.cancel")}
                                </button>

                                <button
                                    className="filters-apply"
                                    onClick={handleApplyFilters}
                                    type="button"
                                >
                                    {t("feed.filters.apply")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showUpgradeModal && (
                <div
                    className="upgrade-modal-overlay"
                    onClick={() => setShowUpgradeModal(false)}
                >
                    <div
                        className="upgrade-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="upgrade-close-btn"
                            onClick={() => setShowUpgradeModal(false)}
                        >
                            ×
                        </button>

                        <div className="upgrade-badge">PRO</div>

                        <h2>{t("feed.upgrade.title")}</h2>

                        <p>
                            {t("feed.upgrade.subtitle")}
                        </p>

                        {!!upgradeReason && (
                            <div className="upgrade-reason-box">
                                {upgradeReason}
                            </div>
                        )}

                        <div className="upgrade-plan-box">
                            <div className="upgrade-plan free">
                                <h3>{t("feed.upgrade.freeTitle")}</h3>
                                <p>{t("feed.upgrade.free1")}</p>
                                <p>{t("feed.upgrade.free2")}</p>
                                <p>{t("feed.upgrade.free3")}</p>
                                <p>{t("feed.upgrade.free4")}</p>
                            </div>

                            <div className="upgrade-plan pro">
                                <h3>{t("feed.upgrade.proTitle")}</h3>
                                <p>{t("feed.upgrade.pro1")}</p>
                                <p>{t("feed.upgrade.pro2")}</p>
                                <p>{t("feed.upgrade.pro3")}</p>
                                <p>{t("feed.upgrade.pro4")}</p>
                            </div>
                        </div>

                        <button
                            className="upgrade-main-btn"
                            onClick={() => navigate("/pricing")}
                        >
                            {t("feed.upgrade.button")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
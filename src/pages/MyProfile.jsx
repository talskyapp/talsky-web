import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/config";
import axios from "axios";
import "../styles/MyProfile.css";
import { useTranslation } from "../hooks/useTranslation";

export default function MyProfile() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [user, setUser] = useState(null);
    const [savedCardsCount, setSavedCardsCount] = useState(0);

    // 🔒 ocultos por ahora hasta lanzamiento oficial
    const showAIStats = false;
    const showStreakStats = false;

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem("token");

                const userRes = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const fetchedUser = userRes.data.user;
                setUser(fetchedUser);

                try {
                    const cardsRes = await axios.get(`${API_URL}/api/vocabulary`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    setSavedCardsCount(
                        Array.isArray(cardsRes.data) ? cardsRes.data.length : 0
                    );
                } catch (cardsErr) {
                    console.log("Error loading cards count:", cardsErr);
                    setSavedCardsCount(0);
                }
            } catch (err) {
                console.log("Error loading profile:", err);
            }
        };

        fetchProfileData();
    }, []);

    const getAge = (birthday) => {
        if (!birthday) return null;
        const diff = Date.now() - new Date(birthday).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const location = user?.location || {};
    const countryFlag = location.countryFlag || "";
    const country =
        user?.country || location.country || t("myProfile.unknownCountry");

    const age = getAge(user?.birthday);

    const daysInApp = user?.createdAt
        ? Math.floor(
            (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
        )
        : 0;

    const genderSymbol =
        user?.gender === "male" ? "♂" : user?.gender === "female" ? "♀" : "";

    const profilePhoto = user?.photo
        ? user.photo.startsWith("http")
            ? user.photo
            : `${API_URL}${user.photo}`
        : "/default-avatar.jpg";

    const primaryLanguage =
        user?.activeLearningLanguage ||
        user?.languageToLearn?.[0] ||
        t("myProfile.notSelected");

    const extraLanguagesCount = Array.isArray(user?.languageToLearn)
        ? Math.max(user.languageToLearn.length - 1, 0)
        : 0;

    const interestsCount = Array.isArray(user?.interests)
        ? user.interests.length
        : 0;

    const currentStreak = user?.streakCount || 0;
    const longestStreak = user?.longestStreak || 0;
    const chatsStartedToday = user?.dailyUsage?.newChatsStarted || 0;
    const appLanguage = user?.appLanguage || "en";

    if (!user) {
        return (
            <div className="my-profile-loading">
                {t("myProfile.loading")}
            </div>
        );
    }

    return (
        <div className="my-profile-page">
            <div className="my-profile-shell">
                <div className="my-profile-top-card">
                    <div className="my-profile-identity">
                        <img
                            src={profilePhoto}
                            alt="profile"
                            className="my-profile-photo"
                        />

                        <div className="my-profile-main-info">
                            <div className="my-profile-name-row">
                                <h1>{user.name}</h1>
                                {(age || genderSymbol) && (
                                    <span className="my-profile-age-gender">
                                        {age ? `${age}` : ""} {genderSymbol}
                                    </span>
                                )}
                            </div>

                            <p className="my-profile-username">
                                @{user.username || t("myProfile.defaultUsername")}
                            </p>

                            <div className="my-profile-meta">
                                <span className="my-meta-pill">
                                    {countryFlag} {country}
                                </span>
                                <span className="my-meta-pill">
                                    {t("myProfile.daysInAppShort", {
                                        count: daysInApp,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="my-profile-actions">
                        <button
                            className="my-profile-btn secondary"
                            onClick={() => navigate(`/dashboard/profile/${user._id}`)}
                            title={t("myProfile.viewAsPublic")}
                        >
                            {t("myProfile.viewPublic")}
                        </button>

                        <button
                            className="my-profile-btn primary"
                            onClick={() => navigate("/dashboard/profile/edit")}
                            title={t("myProfile.editProfile")}
                        >
                            {t("myProfile.editProfile")}
                        </button>
                    </div>
                </div>

                <div className="my-profile-tabs">
                    <button className="active-tab">
                        {t("myProfile.personalInfo")}
                    </button>
                </div>

                <div className="profile-overview-grid">
                    <div className="overview-card">
                        <div className="overview-card-top">
                            <p className="overview-kicker">
                                {t("myProfile.activity")}
                            </p>
                            <h3>{t("myProfile.yourActivity")}</h3>
                        </div>

                        <div className="overview-stats-grid">
                            <div className="overview-mini-stat">
                                <span className="overview-stat-label">
                                    {t("myProfile.daysInApp")}
                                </span>
                                <strong>{daysInApp}</strong>
                            </div>

                            <div className="overview-mini-stat">
                                <span className="overview-stat-label">
                                    {t("myProfile.chatsStartedToday")}
                                </span>
                                <strong>{chatsStartedToday}</strong>
                            </div>

                            <div className="overview-mini-stat">
                                <span className="overview-stat-label">
                                    {t("myProfile.profileCompleted")}
                                </span>
                                <strong>
                                    {user.profileCompleted
                                        ? t("myProfile.yes")
                                        : t("myProfile.no")}
                                </strong>
                            </div>

                            <div className="overview-mini-stat">
                                <span className="overview-stat-label">
                                    {t("myProfile.interests")}
                                </span>
                                <strong>{interestsCount}</strong>
                            </div>
                        </div>
                    </div>

                    {showAIStats && (
                        <div className="overview-card">
                            <div className="overview-card-top">
                                <p className="overview-kicker">
                                    {t("myProfile.aiUsage")}
                                </p>
                                <h3>{t("myProfile.aiLearning")}</h3>
                            </div>

                            <div className="overview-stats-grid">
                                <div className="overview-mini-stat">
                                    <span className="overview-stat-label">
                                        {t("myProfile.cardsSaved")}
                                    </span>
                                    <strong>{savedCardsCount}</strong>
                                </div>

                                <div className="overview-mini-stat">
                                    <span className="overview-stat-label">
                                        {t("myProfile.primaryLanguage")}
                                    </span>
                                    <strong>{primaryLanguage}</strong>
                                </div>

                                <div className="overview-mini-stat">
                                    <span className="overview-stat-label">
                                        {t("myProfile.extraLanguages")}
                                    </span>
                                    <strong>{extraLanguagesCount}</strong>
                                </div>

                                <div className="overview-mini-stat">
                                    <span className="overview-stat-label">
                                        {t("myProfile.appLanguage")}
                                    </span>
                                    <strong>{String(appLanguage).toUpperCase()}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {showStreakStats && (
                        <div className="overview-card highlight-streak">
                            <div className="overview-card-top">
                                <p className="overview-kicker">
                                    {t("myProfile.streak")}
                                </p>
                                <h3>{t("myProfile.consistency")}</h3>
                            </div>

                            <div className="streak-hero-row">
                                <div className="streak-main-box">
                                    <span className="streak-flame">🔥</span>
                                    <div>
                                        <p className="streak-main-label">
                                            {t("myProfile.currentStreak")}
                                        </p>
                                        <h2>{currentStreak}</h2>
                                    </div>
                                </div>

                                <div className="streak-side-stats">
                                    <div className="overview-mini-stat compact">
                                        <span className="overview-stat-label">
                                            {t("myProfile.bestStreak")}
                                        </span>
                                        <strong>{longestStreak}</strong>
                                    </div>

                                    <div className="overview-mini-stat compact">
                                        <span className="overview-stat-label">
                                            {t("myProfile.lastActive")}
                                        </span>
                                        <strong>
                                            {user.lastSeen
                                                ? new Date(user.lastSeen).toLocaleDateString()
                                                : t("myProfile.noDate")}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="info-grid">
                    <div className="my-profile-section-card">
                        <h3>{t("myProfile.aboutMe")}</h3>
                        <p>
                            {user.bio && user.bio.trim() !== ""
                                ? user.bio
                                : t("myProfile.noInfoAdded")}
                        </p>
                    </div>

                    <div className="my-profile-section-card">
                        <h3>{t("myProfile.goal")}</h3>
                        <p>
                            {user.goals && user.goals.trim() !== ""
                                ? user.goals
                                : t("myProfile.noGoalAdded")}
                        </p>
                    </div>

                    <div className="my-profile-section-card">
                        <h3>{t("myProfile.idealPartner")}</h3>
                        {user.preferredTraits && user.preferredTraits.length > 0 ? (
                            <div className="tags-wrap">
                                {user.preferredTraits.map((trait, i) => (
                                    <span key={i} className="soft-tag">
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p>{t("myProfile.noPartnerPreferences")}</p>
                        )}
                    </div>

                    <div className="my-profile-section-card">
                        <h3>{t("myProfile.interests")}</h3>
                        {user.interests && user.interests.length > 0 ? (
                            <div className="tags-wrap">
                                {user.interests.map((interest, i) => (
                                    <span key={i} className="soft-tag">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p>{t("myProfile.noInterestsAdded")}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
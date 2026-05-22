import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";
import {
    MessageCircle,
    UserPlus,
    UserMinus,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/UserProfile.css";

dayjs.extend(relativeTime);

export default function UserProfile({ user }) {
    const { t, language } = useTranslation();

    const token = localStorage.getItem("token");
    const myId = token ? JSON.parse(atob(token.split(".")[1])).id : null;
    const API_URL = import.meta.env.VITE_API_URL;
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const navigate = useNavigate();
    const [showMore, setShowMore] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState(
        t("userProfile.upgradeDefaultMessage")
    );
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [openPhotoModal, setOpenPhotoModal] = useState(false);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        setUpgradeMessage(t("userProfile.upgradeDefaultMessage"));
    }, [t]);

    useEffect(() => {
        if (!window.socket) return;

        const handleOnlineUsers = (users) => {
            setOnlineUsers(Array.isArray(users) ? users : []);
        };

        const handleUserOnline = ({ userId }) => {
            if (!userId) return;

            setOnlineUsers((prev) => {
                const exists = prev.some(
                    (id) => id?.toString() === userId?.toString()
                );

                if (exists) return prev;
                return [...prev, userId];
            });
        };

        window.socket.on("online_users", handleOnlineUsers);
        window.socket.on("user_online", handleUserOnline);

        return () => {
            window.socket.off("online_users", handleOnlineUsers);
            window.socket.off("user_online", handleUserOnline);
        };
    }, []);

    useEffect(() => {
        if (!openPhotoModal) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setOpenPhotoModal(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [openPhotoModal]);

    useEffect(() => {
        const fetchFollowStatus = async () => {
            if (!user?._id || user._id === myId) {
                setIsFollowing(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${API_URL}/api/follows/status/${user._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data.error ||
                        data.msg ||
                        t("userProfile.errors.followStatusFailed")
                    );
                }

                setIsFollowing(!!data.isFollowing);
            } catch (error) {
                console.error("Fetch follow status error:", error);
                setIsFollowing(false);
            }
        };

        fetchFollowStatus();
    }, [user?._id, myId, API_URL, t]);

    if (!user) return null;

    const {
        _id,
        name,
        username,
        birthday,
        gender,
        photo,
        bio,
        location,
        nativeLanguage,
        fluentLanguages,
        languageToLearn,
        goals,
        idealPartner,
        interests,
        lastSeen,
        subscription,
    } = user;

    const isOwnProfile = myId === _id;

    const isProUser =
        subscription?.plan === "pro" &&
        ["active", "trialing", "past_due"].includes(subscription?.status);

    const isOnline = onlineUsers.some(
        (id) => id?.toString() === _id?.toString()
    );

    const statusLabel = isOnline
        ? t("userProfile.onlineNow")
        : t("userProfile.activeAgo", {
            time: lastSeen ? dayjs(lastSeen).locale(language).fromNow() : t("userProfile.recently"),
        });

    const age = useMemo(() => {
        if (!birthday) return null;
        const diff = Date.now() - new Date(birthday).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }, [birthday]);

    const genderIcon =
        gender === "male" ? "♂" :
            gender === "female" ? "♀" :
                "⚧";

    const localTime = useMemo(() => {
        try {
            return new Date().toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
                timeZone: location?.timezone || "UTC",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return t("userProfile.unknownTime");
        }
    }, [location?.timezone, language, t]);

    const timezoneCity = useMemo(() => {
        if (!location?.timezone) return null;
        const parts = location.timezone.split("/");
        if (parts.length < 2) return null;
        return parts[1].replace(/_/g, " ");
    }, [location?.timezone]);

    const isValidCity = useMemo(() => {
        if (!location?.city) return false;

        const city = location.city.toLowerCase();
        const nycBoroughs = ["queens", "brooklyn", "bronx", "manhattan", "staten island"];

        if (nycBoroughs.includes(city)) return false;
        if (city.split(" ").length > 1) return false;
        if (location.city.length < 4) return false;

        return true;
    }, [location?.city]);

    const cityToShow = isValidCity ? location.city : timezoneCity;
    const countryToShow = location?.country;

    const showLocation = useMemo(() => {
        if (cityToShow && countryToShow) return `${cityToShow}, ${countryToShow}`;
        if (countryToShow) return countryToShow;
        return t("userProfile.unknownLocation");
    }, [cityToShow, countryToShow, t]);

    const regionFromTimezone = location?.timezone
        ? location.timezone.split("/")[1]?.replace(/_/g, " ")
        : null;

    const mapQuery = regionFromTimezone || countryToShow || t("userProfile.world");

    const learningLanguages = Array.isArray(languageToLearn)
        ? languageToLearn
        : languageToLearn
            ? [languageToLearn]
            : [];

    const profilePhoto = photo
        ? photo.startsWith("http")
            ? photo
            : `${API_URL}${photo}`
        : "/default-avatar.jpg";

    const openUpgradeModal = (message) => {
        setUpgradeMessage(message);
        setShowUpgradeModal(true);
    };

    const handleMessage = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("Missing token");
                return;
            }

            if (!API_URL) {
                console.error("Missing VITE_API_URL");
                return;
            }

            const res = await fetch(`${API_URL}/api/chats/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: _id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.upgradeRequired) {
                    openUpgradeModal(
                        data.msg || t("userProfile.errors.dailyLimitReached")
                    );
                    return;
                }

                throw new Error(data.msg || t("userProfile.errors.chatStartFailed"));
            }

            navigate("/dashboard/chat-v2", {
                state: {
                    openChatId: data.chatId,
                    tempChatUser: user,
                },
            });
        } catch (err) {
            console.error("Error opening chat:", err);
            alert(t("userProfile.errors.couldNotOpenChat"));
        }
    };

    const handleFollowToggle = async () => {
        if (!_id || _id === myId) return;
        if (followLoading) return;

        try {
            setFollowLoading(true);

            const token = localStorage.getItem("token");
            const method = isFollowing ? "DELETE" : "POST";

            const res = await fetch(`${API_URL}/api/follows/${_id}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("userProfile.errors.followUpdateFailed"));
            }

            setIsFollowing(!!data.isFollowing);
        } catch (error) {
            console.error("Follow toggle error:", error);
            alert(error.message || t("userProfile.errors.somethingWentWrong"));
        } finally {
            setFollowLoading(false);
        }
    };

    const handleUpgrade = () => {
        navigate("/dashboard/pricing");
    };

    function LevelBars({ level = 0, type = "native" }) {
        const total = 4;

        return (
            <div className="mini-bars">
                {Array.from({ length: total }).map((_, i) => (
                    <span
                        key={i}
                        className={`mini-bar ${type} ${i < level ? "filled" : ""}`}
                    />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="profile-page">
                <div className="profile-hero">
                    <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapQuery)}&zoom=7&size=1200x420&maptype=roadmap&key=${GOOGLE_MAPS_API_KEY}`}
                        alt={t("userProfile.mapAlt")}
                        className="profile-map"
                    />
                    <div className="profile-hero-overlay" />
                </div>

                <div className="profile-shell">
                    <div className="profile-top-card">
                        <div className={`profile-avatar-wrap ${isProUser ? "profile-avatar-wrap-pro" : ""}`}>
                            <div
                                className="profile-avatar-frame profile-avatar-clickable"
                                onClick={() => setOpenPhotoModal(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setOpenPhotoModal(true);
                                    }
                                }}
                            >
                                <img
                                    src={profilePhoto}
                                    alt={t("userProfile.profileAlt")}
                                    className="profile-avatar"
                                />
                                {isProUser && (
                                    <span className="profile-avatar-pro-badge">PRO</span>
                                )}
                            </div>
                        </div>

                        <div className="profile-main">
                            <div className="profile-main-left">
                                <div className="profile-name-row">
                                    <h1 className="profile-name">
                                        {name}
                                        {age && <span className="profile-age">{age}</span>}
                                    </h1>
                                    <span className="profile-gender">{genderIcon}</span>
                                </div>

                                <p className="profile-username">@{username}</p>

                                <div className="profile-status-row">
                                    <span className="profile-status-badge">
                                        {isOnline && <span className="profile-online-dot" />}
                                        {statusLabel}
                                    </span>

                                    <span className="profile-soft-pill">
                                        {t("userProfile.fromCountry", {
                                            country: user.country || t("userProfile.unknownCountry"),
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="profile-main-actions">
                                {isOwnProfile ? (
                                    <button
                                        className="profile-btn-primary"
                                        onClick={() => navigate("/dashboard/profile/edit")}
                                    >
                                        {t("userProfile.editProfile")}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="profile-btn-primary profile-btn-with-icon"
                                            onClick={handleMessage}
                                        >
                                            <MessageCircle size={18} />
                                            <span>{t("userProfile.message")}</span>
                                        </button>

                                        <button
                                            className={`profile-btn-secondary profile-btn-with-icon ${isFollowing ? "profile-btn-following" : ""}`}
                                            onClick={handleFollowToggle}
                                            disabled={followLoading}
                                        >
                                            {followLoading ? (
                                                <span>
                                                    {isFollowing
                                                        ? t("userProfile.updating")
                                                        : t("userProfile.followingLoading")}
                                                </span>
                                            ) : isFollowing ? (
                                                <>
                                                    <UserMinus size={18} />
                                                    <span>{t("userProfile.unfollow")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={18} />
                                                    <span>{t("userProfile.follow")}</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-col-main">
                            {isOwnProfile && !isProUser && (
                                <section className="profile-card pro-card pro-card-mobile">
                                    <div className="pro-card-glow" />
                                    <div className="pro-badge">PRO</div>

                                    <h3 className="pro-title">{t("userProfile.upgradeTitle")}</h3>

                                    <p className="pro-text">
                                        {t("userProfile.upgradeText")}
                                    </p>

                                    <button
                                        className="pro-upgrade-btn"
                                        onClick={handleUpgrade}
                                    >
                                        {t("userProfile.upgradeNow")}
                                    </button>
                                </section>
                            )}

                            <section className="profile-card">
                                <div className="section-head">
                                    <h3>{t("userProfile.about")}</h3>
                                </div>
                                <p className="profile-text">
                                    {bio || t("userProfile.noBio")}
                                </p>
                            </section>

                            <section className="profile-card">
                                <div className="section-head">
                                    <h3>{t("userProfile.languages")}</h3>
                                </div>

                                <div className="language-list">
                                    <div className="language-item">
                                        <div>
                                            <p className="language-label">{t("userProfile.native")}</p>
                                            <h4>{nativeLanguage || "—"}</h4>
                                        </div>
                                        <LevelBars level={4} type="native" />
                                    </div>

                                    {Array.isArray(fluentLanguages) && fluentLanguages.length > 0 && (
                                        <div className="language-item">
                                            <div>
                                                <p className="language-label">{t("userProfile.fluent")}</p>
                                                <h4>{fluentLanguages.join(", ")}</h4>
                                            </div>
                                            <LevelBars level={3} type="fluent" />
                                        </div>
                                    )}

                                    <div className="language-item">
                                        <div>
                                            <p className="language-label">{t("userProfile.learning")}</p>
                                            <h4>
                                                {learningLanguages[0] || "—"}
                                                {learningLanguages.length > 1 && (
                                                    <button
                                                        className="show-more-btn"
                                                        onClick={() => setShowMore((prev) => !prev)}
                                                    >
                                                        {showMore
                                                            ? t("userProfile.hide")
                                                            : t("userProfile.moreLanguages", {
                                                                count: learningLanguages.length - 1,
                                                            })}
                                                    </button>
                                                )}
                                            </h4>
                                        </div>
                                        <LevelBars level={1} type="learning" />
                                    </div>

                                    {showMore && learningLanguages.length > 1 && (
                                        <div className="extra-language-chips">
                                            {learningLanguages.slice(1).map((lang, i) => (
                                                <span key={i} className="extra-language-pill">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="profile-card">
                                <div className="section-head">
                                    <h3>{t("userProfile.interests")}</h3>
                                </div>

                                {interests?.length > 0 ? (
                                    <div className="interests-grid">
                                        {interests.map((item, idx) => (
                                            <span key={idx} className="interest-tag">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="profile-text">{t("userProfile.noInterests")}</p>
                                )}
                            </section>
                        </div>

                        <div className="profile-col-side">
                            {isOwnProfile && !isProUser && (
                                <section className="profile-card pro-card pro-card-desktop">
                                    <div className="pro-card-glow" />
                                    <div className="pro-badge">PRO</div>

                                    <h3 className="pro-title">{t("userProfile.upgradeTitle")}</h3>

                                    <p className="pro-text">
                                        {t("userProfile.upgradeText")}
                                    </p>

                                    <button
                                        className="pro-upgrade-btn"
                                        onClick={handleUpgrade}
                                    >
                                        {t("userProfile.upgradeNow")}
                                    </button>
                                </section>
                            )}

                            <section className="profile-card">
                                <div className="section-head">
                                    <h3>{t("userProfile.location")}</h3>
                                </div>

                                <div className="info-stack">
                                    <div className="info-box">
                                        <span>{t("userProfile.basedIn")}</span>
                                        <strong>{showLocation}</strong>
                                    </div>
                                    <div className="info-box">
                                        <span>{t("userProfile.localTime")}</span>
                                        <strong>{localTime}</strong>
                                    </div>
                                </div>
                            </section>

                            <section className="profile-card">
                                <div className="section-head">
                                    <h3>{t("userProfile.goal")}</h3>
                                </div>
                                <p className="profile-text">{goals || t("userProfile.noGoals")}</p>
                            </section>

                            <section className="profile-card">
                                <div className="section-head">
                                    <h3>{t("userProfile.idealPartner")}</h3>
                                </div>
                                <p className="profile-text">
                                    {idealPartner || t("userProfile.noIdealPartner")}
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            {openPhotoModal && (
                <div
                    className="profile-photo-modal-overlay"
                    onClick={() => setOpenPhotoModal(false)}
                >
                    <div
                        className="profile-photo-modal profile-photo-modal-animated"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="profile-photo-close"
                            onClick={() => setOpenPhotoModal(false)}
                            type="button"
                        >
                            ✕
                        </button>

                        <div className="profile-photo-modal-topbar">
                            <div className="profile-photo-modal-user">
                                <img
                                    src={profilePhoto}
                                    alt={name || t("userProfile.profile")}
                                    className="profile-photo-modal-user-avatar"
                                />
                                <div className="profile-photo-modal-user-info">
                                    <strong>{name || t("userProfile.user")}</strong>
                                    <span>@{username}</span>
                                </div>
                            </div>
                        </div>

                        <img
                            src={profilePhoto}
                            alt={name || t("userProfile.profile")}
                            className="profile-photo-modal-img"
                        />
                    </div>
                </div>
            )}

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

                        <h2>{t("userProfile.upgradeTitle")}</h2>
                        <p>{upgradeMessage}</p>

                        <div className="upgrade-plan-box">
                            <div className="upgrade-plan free">
                                <h3>{t("userProfile.freePlan")}</h3>
                                <p>{t("userProfile.freePlan1")}</p>
                                <p>{t("userProfile.freePlan2")}</p>
                                <p>{t("userProfile.freePlan3")}</p>
                                <p>{t("userProfile.freePlan4")}</p>
                                <p>{t("userProfile.freePlan5")}</p>
                            </div>

                            <div className="upgrade-plan pro">
                                <h3>{t("userProfile.proPlan")}</h3>
                                <p>{t("userProfile.proPlan1")}</p>
                                <p>{t("userProfile.proPlan2")}</p>
                                <p>{t("userProfile.proPlan3")}</p>
                                <p>{t("userProfile.proPlan4")}</p>
                                <p>{t("userProfile.proPlan5")}</p>
                            </div>
                        </div>

                        <button className="upgrade-main-btn" onClick={handleUpgrade}>
                            {t("userProfile.upgradeNowLower")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
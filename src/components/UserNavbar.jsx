import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { House, MessageCircle, BookOpen, Settings, QrCode } from "lucide-react";
import { getSocket } from "../socket";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import ProfileQRModal from "../components/ProfileQRModal";
import NotificationBell from "../components/NotificationBell";
import "../styles/UserNavbar.css";

export default function UserNavbar({ user, isMobile, isChatPage, chatId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // 🔒 feature flags temporales
    const showLearnNav = false;
    const showStreakNav = false;
    const showLeaderboardNav = false;
    const showNotificationsNav = true;
    const showAITutorNav = true;

    const hideNavbarRoutes = ["/dashboard/create-profile"];
    const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

    const [openProfileMenu, setOpenProfileMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isStreakPulsing, setIsStreakPulsing] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    const token = localStorage.getItem("token");
    const myId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

    const isActive = (path) => location.pathname.startsWith(path);
    const isMessages =
        location.pathname.includes("/chat") || location.pathname.includes("/messages");
    const isOwnProfilePage =
        location.pathname === "/dashboard/profile" ||
        location.pathname === "/dashboard/profile/";

    const showTopNavbar = !shouldHideNavbar && !(isMobile && isChatPage);
    const showBottomNavbar =
        !shouldHideNavbar && isMobile && (!isChatPage || !chatId);

    function handleLogout() {
        setOpenProfileMenu(false);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }

        navigate("/login");
    }

    useEffect(() => {
        setOpenProfileMenu(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".navbar-profile-wrap")) {
                setOpenProfileMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const goTo = (path) => {
        setOpenProfileMenu(false);
        navigate(path);
    };

    useEffect(() => {
        if (!token || !myId) return;

        fetch(`${API_URL}/api/chats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                const normalized = data.map((chat) => {
                    const readByMe =
                        Array.isArray(chat.lastMessageReadBy) &&
                        chat.lastMessageReadBy.some(
                            (id) => id?.toString() === myId?.toString()
                        );

                    return {
                        ...chat,
                        unread:
                            chat.lastSender?.toString() !== myId?.toString() &&
                            !readByMe,
                    };
                });

                const totalUnread = normalized.filter((chat) => chat.unread).length;
                setUnreadCount(totalUnread);
            })
            .catch(() => { });
    }, [token, myId]);

    useEffect(() => {
        if (!myId || !token) return;

        const socket = getSocket();

        const syncUnreadCount = () => {
            fetch(`${API_URL}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    const normalized = data.map((chat) => {
                        const readByMe =
                            Array.isArray(chat.lastMessageReadBy) &&
                            chat.lastMessageReadBy.some(
                                (id) => id?.toString() === myId?.toString()
                            );

                        return {
                            ...chat,
                            unread:
                                chat.lastSender?.toString() !== myId?.toString() &&
                                !readByMe,
                        };
                    });

                    const totalUnread = normalized.filter((chat) => chat.unread).length;
                    setUnreadCount(totalUnread);
                })
                .catch(() => { });
        };

        socket.on("sidebar_chat_updated", syncUnreadCount);
        socket.on("messages_read", syncUnreadCount);

        return () => {
            socket.off("sidebar_chat_updated", syncUnreadCount);
            socket.off("messages_read", syncUnreadCount);
        };
    }, [myId, token]);

    useEffect(() => {
        if (!showStreakNav) return;
        if (!token) return;

        fetch(`${API_URL}/api/users/me/streak`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setStreak(data.streakCount || 0);
            })
            .catch(() => { });
    }, [token, showStreakNav]);

    useEffect(() => {
        if (!showStreakNav) return;

        if (typeof user?.streak === "number") {
            setStreak(user.streak);
        }
    }, [user?.streak, showStreakNav]);

    useEffect(() => {
        if (!showStreakNav) return;

        const handleStreakEarned = (event) => {
            const nextStreak = event.detail?.nextStreak;

            if (typeof nextStreak === "number") {
                setStreak(nextStreak);
                setIsStreakPulsing(true);

                setTimeout(() => {
                    setIsStreakPulsing(false);
                }, 700);
            }
        };

        window.addEventListener("lesson-streak-earned", handleStreakEarned);

        return () => {
            window.removeEventListener("lesson-streak-earned", handleStreakEarned);
        };
    }, [showStreakNav]);

    const mobileHandle =
        user?.username
            ? `@${user.username}`
            : user?.handle
                ? `@${user.handle}`
                : user?.name
                    ? `@${String(user.name).toLowerCase().replace(/\s+/g, "")}`
                    : `@${t("navbar.profile").toLowerCase()}`;

    const resolvePhoto = (photo) => {
        if (!photo) return "/default-avatar.jpg";
        return photo.startsWith("http") ? photo : `${API_URL}${photo}`;
    };

    return (
        <>
            {showTopNavbar && !isMobile && (
                <header className="app-navbar">
                    <div className="app-navbar-inner">
                        <button
                            className="nav-brand"
                            onClick={() => navigate("/dashboard/feed")}
                            type="button"
                        >
                            <div className="nav-brand-logo-wrap">
                                <img
                                    src="https://th.bing.com/th/id/OIP.tGQ3WqH8FJpz6bH7SdgwmgHaHa?w=189&h=189&c=7&r=0&o=7&pid=1.7&rm=3"
                                    alt="TalSky"
                                    className="nav-brand-logo"
                                />
                            </div>

                            <div className="nav-brand-text">
                                <span className="nav-brand-title">TalSky</span>
                            </div>
                        </button>

                        <nav className="nav-links nav-links-desktop">
                            <Link
                                to="/dashboard/feed"
                                className={isActive("/dashboard/feed") ? "active" : ""}
                            >
                                {t("navbar.social")}
                            </Link>

                            {showLearnNav && (
                                <Link
                                    to="/dashboard/learn"
                                    className={isActive("/dashboard/learn") ? "active" : ""}
                                >
                                    {t("navbar.learn")}
                                </Link>
                            )}

                            {showAITutorNav && (
                                <Link
                                    to="/dashboard/ai-tutor"
                                    className={`ai-link ${isActive("/dashboard/ai-tutor") ? "active" : ""}`}
                                >
                                    ✨ {t("navbar.aiTutor")}
                                </Link>
                            )}
                        </nav>

                        <div className="nav-actions">
                            {showStreakNav && (
                                <div
                                    className={`nav-streak ${isStreakPulsing ? "pulse" : ""}`}
                                    data-streak-target
                                    id="navbar-streak-target"
                                >
                                    <span className="navbar-streak-flame">🔥</span>
                                    <span className="navbar-streak-count">{streak}</span>
                                </div>
                            )}

                            {showLeaderboardNav && (
                                <button
                                    className="nav-icon-btn"
                                    type="button"
                                    onClick={() => navigate("/dashboard/leaderboard")}
                                    aria-label={t("navbar.leaderboard")}
                                    title={t("navbar.leaderboard")}
                                >
                                    🏆
                                </button>
                            )}

                            {showNotificationsNav && <NotificationBell />}

                            <button
                                className="nav-icon-btn chat-btn"
                                type="button"
                                onClick={() => navigate("/dashboard/chat-v2")}
                                aria-label={t("navbar.chat")}
                                title={t("navbar.chat")}
                            >
                                💬
                                {unreadCount > 0 && (
                                    <span className="chat-nav-badge">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            <div className="navbar-profile-wrap">
                                <button
                                    className="navbar-profile-trigger"
                                    onClick={() => setOpenProfileMenu((prev) => !prev)}
                                    type="button"
                                >
                                    <img
                                        src={resolvePhoto(user?.photo)}
                                        alt="profile"
                                        className="navbar-profile-avatar"
                                    />
                                </button>

                                {openProfileMenu && (
                                    <div className="navbar-profile-menu">
                                        <button onClick={() => goTo("/dashboard/profile")}>
                                            {t("navbar.myProfile")}
                                        </button>
                                        <button onClick={() => goTo("/dashboard/settings")}>
                                            {t("navbar.settings")}
                                        </button>
                                        <button onClick={() => goTo("/dashboard/settings/help")}>
                                            {t("navbar.help")}
                                        </button>
                                        <button onClick={handleLogout}>
                                            {t("navbar.logout")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {showTopNavbar && isMobile && !isOwnProfilePage && (
                <header className="app-navbar mobile-top-navbar">
                    <div className="app-navbar-inner mobile-top-navbar-inner">
                        <button
                            className="nav-brand mobile-brand-only"
                            onClick={() => navigate("/dashboard/feed")}
                            type="button"
                        >
                            <div className="nav-brand-logo-wrap">
                                <img
                                    src="https://th.bing.com/th/id/OIP.tGQ3WqH8FJpz6bH7SdgwmgHaHa?w=189&h=189&c=7&r=0&o=7&pid=1.7&rm=3"
                                    alt="TalSky"
                                    className="nav-brand-logo"
                                />
                            </div>
                        </button>

                        <div className="nav-actions mobile-only-actions">
                            {showStreakNav && (
                                <div className={`nav-streak ${isStreakPulsing ? "pulse" : ""}`}>
                                    <span className="navbar-streak-flame">🔥</span>
                                    <span className="navbar-streak-count">{streak}</span>
                                </div>
                            )}

                            {showLeaderboardNav && (
                                <button
                                    className="nav-icon-btn"
                                    type="button"
                                    onClick={() => navigate("/dashboard/leaderboard")}
                                    aria-label={t("navbar.leaderboard")}
                                    title={t("navbar.leaderboard")}
                                >
                                    🏆
                                </button>
                            )}

                            {showNotificationsNav && <NotificationBell />}
                        </div>
                    </div>
                </header>
            )}

            {showTopNavbar && isMobile && isOwnProfilePage && (
                <header className="app-navbar mobile-top-navbar mobile-profile-navbar">
                    <div className="app-navbar-inner mobile-profile-navbar-inner">
                        <button
                            className="mobile-profile-qr-btn"
                            onClick={() => setShowQRModal(true)}
                        >
                            <div className="mobile-profile-qr-box">
                                <QrCode size={18} />
                            </div>
                        </button>

                        <div className="mobile-profile-handle">
                            {mobileHandle}
                        </div>

                        <div className="mobile-profile-right-actions">
                            {showNotificationsNav && <NotificationBell />}

                            <button
                                className="nav-icon-btn"
                                type="button"
                                onClick={() => navigate("/dashboard/settings")}
                                aria-label={t("navbar.settings")}
                                title={t("navbar.settings")}
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {showBottomNavbar && (
                <nav className="mobile-bottom-nav">
                    <button
                        type="button"
                        className={isActive("/dashboard/feed") ? "active" : ""}
                        onClick={() => navigate("/dashboard/feed")}
                        aria-label={t("navbar.home")}
                    >
                        <House size={22} />
                    </button>

                    <button
                        type="button"
                        className={isMessages ? "active" : ""}
                        onClick={() => navigate("/dashboard/chat-v2")}
                        aria-label={t("navbar.messages")}
                    >
                        <div className="mobile-bottom-icon-wrap">
                            <MessageCircle size={22} />
                            {unreadCount > 0 && (
                                <span className="mobile-bottom-badge">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </div>
                    </button>

                    {showLearnNav && (
                        <button
                            type="button"
                            className={isActive("/dashboard/learn") ? "active" : ""}
                            onClick={() => navigate("/dashboard/learn")}
                            aria-label={t("navbar.learn")}
                        >
                            <BookOpen size={22} />
                        </button>
                    )}

                    <button
                        type="button"
                        className={isOwnProfilePage ? "active profile-tab-btn" : "profile-tab-btn"}
                        onClick={() => navigate("/dashboard/profile")}
                        aria-label={t("navbar.profile")}
                    >
                        <img
                            src={resolvePhoto(user?.photo)}
                            alt="Profile"
                            className="mobile-profile-avatar"
                        />
                    </button>
                </nav>
            )}

            {showQRModal && (
                <ProfileQRModal
                    user={user}
                    onClose={() => setShowQRModal(false)}
                />
            )}
        </>
    );
}
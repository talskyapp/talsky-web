import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { House, BookOpen, } from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/UserNavbar.css";
import { LANGUAGES } from "../constants/languages";

function getLanguageFlagUrl(language) {
    if (!language?.countryCode) return "";

    return `https://flagcdn.com/w40/${language.countryCode}.png`;
}

export default function UserNavbar({ user, isMobile, isChatPage, chatId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // 🔒 feature flags temporales
    const showLearnNav = false;
    const showAITutorNav = true;

    const hideNavbarRoutes = ["/dashboard/create-profile"];
    const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

    const [openProfileMenu, setOpenProfileMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isStreakPulsing, setIsStreakPulsing] = useState(false);

    const token = localStorage.getItem("token");
    const myId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

    const isActive = (path) => location.pathname.startsWith(path);
    const isAITutor = location.pathname.includes("/dashboard/ai-tutor");
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

    function getLearningLanguageMeta(user) {
        const value =
            user?.activeLearningLanguage ||
            user?.languageToLearn?.[0] ||
            "";

        const normalized = String(value).toLowerCase();

        const language = LANGUAGES.find(
            (lang) =>
                lang.code.toLowerCase() === normalized ||
                lang.name.toLowerCase() === normalized
        );

        return (
            language || {
                code: "unknown",
                name: value || "Language",
                flag: "🌍",
            }
        );
    }

    const learningMeta = getLearningLanguageMeta(user);

    return (
        <>
            {showTopNavbar && !isMobile && (
                <header className="app-navbar">
                    <div className="app-navbar-inner">
                        <button
                            className="nav-brand"
                            onClick={() => navigate("/dashboard/home")}
                            type="button"
                        >
                            <div className="nav-brand-logo-wrap">
                                <img
                                    src="/TalSky.jpeg"
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
                                to="/dashboard/home"
                                className={isActive("/dashboard/home") ? "active" : ""}
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

                            <div className="navbar-learning-language">
                                <img
                                    src={getLanguageFlagUrl(learningMeta)}
                                    alt={learningMeta.name}
                                    className="navbar-learning-flag-img"
                                />
                            </div>

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
                                        <button onClick={() => goTo("/dashboard/settings")}>
                                            {t("navbar.settings")}
                                        </button>
                                        <button onClick={() => goTo("/dashboard/settings/help")}>
                                            {t("navbar.help")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenProfileMenu(false);
                                                setShowLogoutModal(true);
                                            }}
                                        >
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
                            className="nav-brand mobile-brand-full"
                            onClick={() => navigate("/dashboard/home")}
                            type="button"
                        >
                            <div className="nav-brand-logo-wrap">
                                <img
                                    src="/TalSky.jpeg"
                                    alt="TalSky"
                                    className="nav-brand-logo"
                                />
                            </div>

                            <span className="mobile-brand-title">TalSky</span>
                        </button>

                        <div className="navbar-learning-language">
                            <img
                                src={getLanguageFlagUrl(learningMeta)}
                                alt={learningMeta.name}
                                className="navbar-learning-flag-img"
                            />
                        </div>
                    </div>
                </header>
            )}

            {showTopNavbar && isMobile && isOwnProfilePage && (
                <header className="app-navbar mobile-top-navbar mobile-profile-navbar">
                    <div className="app-navbar-inner mobile-profile-navbar-inner">

                        <div className="mobile-profile-handle">
                            {mobileHandle}
                        </div>

                        <div className="mobile-profile-right-actions">
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
                        className={isActive("/dashboard/home") ? "active" : ""}
                        onClick={() => navigate("/dashboard/home")}
                        aria-label={t("navbar.home")}
                    >
                        <House size={22} />
                    </button>

                    <button
                        type="button"
                        className={isAITutor ? "active" : ""}
                        onClick={() => navigate("/dashboard/ai-tutor")}
                        aria-label={t("navbar.aiTutor")}
                    >
                        <BookOpen size={22} />
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
                        onClick={() => navigate("/dashboard/settings")}
                        aria-label={t("navbar.profile")}
                    >
                        <img
                            src={resolvePhoto(user?.photo)}
                            alt="Profile"
                            className="mobile-profile-avatar"
                        />
                    </button>
                </nav >
            )
            }

            {showLogoutModal && (
                <div className="navbar-modal-backdrop">
                    <div className="navbar-modal">
                        <h3>{t("navbar.logoutModal.title")}</h3>
                        <p>{t("navbar.logoutModal.description")}</p>

                        <div className="navbar-modal-actions">
                            <button
                                type="button"
                                className="navbar-modal-cancel"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                {t("common.cancel")}
                            </button>

                            <button
                                type="button"
                                className="navbar-modal-confirm"
                                onClick={handleLogout}
                            >
                                {t("navbar.logoutModal.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
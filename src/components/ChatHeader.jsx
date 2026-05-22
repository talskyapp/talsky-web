import { User, UserPlus, Phone, Flag, Ban } from "lucide-react";
import dayjs from "dayjs";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";

export default function ChatHeader({
    other,
    myId,
    isOnline,
    isBlocked,
    followLoading,
    isFollowing,
    openHeaderMenu,
    setOpenHeaderMenu,
    handleViewProfile,
    handleFollowToggle,
    handleBlockClick,
    setReportReason,
    setReportDetails,
    setShowReportModal,
    setToast, // opcional: si ya tienes un toast global
}) {
    const { t } = useTranslation();

    const isDeletedUser = other?.accountStatus === "deleted";

    const avatarSrc = isDeletedUser
        ? "/default-avatar.png"
        : other?.photo
            ? other.photo.startsWith("http")
                ? other.photo
                : `${API_URL}${other.photo}`
            : "/default-avatar.png";

    const displayName =
        other?.name || other?.username || t("chatWindow.user");

    const handleSafeViewProfile = () => {
        if (!other?._id) return;

        setOpenHeaderMenu(false);

        if (isDeletedUser) {
            if (setToast) {
                setToast({
                    type: "info",
                    message: t("chat.deletedUser") || "User not available",
                });
            }
            return;
        }

        handleViewProfile?.();
    };

    return (
        <div className="chat-header">
            <div className="chat-header-left">
                <div
                    className={`chat-user-block ${isDeletedUser ? "is-deleted" : "is-clickable"}`}
                    onClick={handleSafeViewProfile}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSafeViewProfile();
                        }
                    }}
                    title={
                        isDeletedUser
                            ? t("chat.deletedUser") || "User not available"
                            : t("chatHeader.viewProfile")
                    }
                >
                    <div className="avatar">
                        <img
                            src={avatarSrc}
                            alt={other?.username || t("chatWindow.user")}
                        />
                        {!isDeletedUser && isOnline && (
                            <span className="online-dot"></span>
                        )}
                    </div>

                    <div className="chat-info">
                        <div className="chat-title">
                            {displayName}
                        </div>

                        {isDeletedUser ? (
                            <div className="chat-status deleted-status">
                                {t("chat.deletedUser") || "User not available"}
                            </div>
                        ) : !!(isOnline || other?.lastSeen) ? (
                            <div className="chat-status">
                                {isOnline
                                    ? t("chat.activeNow")
                                    : t("chat.activeStatus", {
                                        time: dayjs(other.lastSeen).fromNow(),
                                    })}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="chat-header-actions">
                <button
                    className="header-icon-btn"
                    title={t("chatHeader.call")}
                    type="button"
                    disabled={isDeletedUser}
                >
                    <Phone size={16} />
                </button>

                <div className="header-menu">
                    <button
                        className="header-icon-btn"
                        title={t("chatHeader.more")}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenHeaderMenu((prev) => !prev);
                        }}
                    >
                        ⋮
                    </button>

                    {openHeaderMenu && (
                        <div className="header-popup-menu">
                            {!isDeletedUser ? (
                                <>
                                    <div
                                        className="header-menu-item"
                                        onClick={handleSafeViewProfile}
                                    >
                                        <User size={16} />
                                        <span>{t("chatHeader.viewProfile")}</span>
                                    </div>

                                    {other?._id !== myId && !isBlocked && (
                                        <div
                                            className={`header-menu-item ${followLoading ? "disabled" : ""}`}
                                            onClick={handleFollowToggle}
                                        >
                                            <UserPlus size={16} />
                                            <span>
                                                {followLoading
                                                    ? t("chatHeader.loading")
                                                    : isFollowing
                                                        ? t("chatHeader.unfollow")
                                                        : t("chatHeader.follow")}
                                            </span>
                                        </div>
                                    )}

                                    <div className="header-menu-item">
                                        <Phone size={16} />
                                        <span>{t("chatHeader.audio")}</span>
                                    </div>

                                    <div className="menu-divider"></div>

                                    <div
                                        className="header-menu-item"
                                        onClick={() => {
                                            setReportReason("");
                                            setReportDetails("");
                                            setShowReportModal(true);
                                            setOpenHeaderMenu(false);
                                        }}
                                    >
                                        <Flag size={16} />
                                        <span>
                                            {t("chatHeader.reportUser", {
                                                name: displayName,
                                            })}
                                        </span>
                                    </div>

                                    {other?._id !== myId && (
                                        <div
                                            className="header-menu-item danger"
                                            onClick={handleBlockClick}
                                        >
                                            <Ban size={16} />
                                            <span>
                                                {isBlocked
                                                    ? t("chatHeader.unblockUser", {
                                                        name: displayName,
                                                    })
                                                    : t("chatHeader.blockUser", {
                                                        name: displayName,
                                                    })}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="header-menu-item disabled deleted-only-item">
                                    <User size={16} />
                                    <span>{t("chat.deletedUser") || "User not available"}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
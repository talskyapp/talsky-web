import { useMemo, useState, useEffect, useRef } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { API_URL } from "../lib/config";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "../hooks/useTranslation";

dayjs.extend(relativeTime);

export default function ChatList({
    chats,
    myId,
    onlineUsers,
    typingByChat,
    onSelectChat,
    selectedChatId,
    onDeleteChat,
}) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuChatId, setOpenMenuChatId] = useState(null);

    const listRef = useRef(null);
 
    const normalizeText = (value) =>
        String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

    const getPreviewText = (chat) => {
        const lastSenderId =
            typeof chat.lastSender === "string"
                ? chat.lastSender
                : chat.lastSender?._id;

        const isMine = lastSenderId?.toString() === myId?.toString();

        if (typingByChat?.[chat._id]?.length > 0) {
            return t("chatList.typing");
        }

        if (!chat.lastMessage) {
            return t("chatList.startConversation");
        }

        const lastMessage = String(chat.lastMessage);

        if (
            lastMessage.toLowerCase().includes("unsent") ||
            lastMessage.toLowerCase().includes("removed")
        ) {
            return isMine
                ? t("chatList.youUnsentMessage")
                : t("chatList.messageRemoved");
        }

        const isPhotoPreview =
            lastMessage.startsWith("📷 ") || lastMessage === "📷 Photo";

        if (isPhotoPreview) {
            return isMine
                ? `${t("chatList.youPrefix")} ${lastMessage}`
                : lastMessage;
        }

        return isMine
            ? `${t("chatList.youPrefix")} ${lastMessage}`
            : lastMessage;
    };

    const sortedChats = useMemo(() => {
        return [...(chats || [])].sort(
            (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
        );
    }, [chats]);

    const filteredChats = useMemo(() => {
        const query = normalizeText(searchQuery);

        if (!query) return sortedChats;

        return sortedChats.filter((chat) => {
            const otherUser = chat.otherUser;

            const displayName = normalizeText(
                otherUser?.name || otherUser?.username || t("chatList.unknownUser")
            );

            const username = normalizeText(otherUser?.username || "");
            const previewText = normalizeText(getPreviewText(chat));

            return (
                displayName.includes(query) ||
                username.includes(query) ||
                previewText.includes(query)
            );
        });
    }, [sortedChats, searchQuery, typingByChat, myId, t]);

    const handleToggleMenu = (e, chatId) => {
        e.stopPropagation();
        setOpenMenuChatId((prev) => (prev === chatId ? null : chatId));
    };

    const handleDeleteClick = (e, chat) => {
        e.stopPropagation();
        setOpenMenuChatId(null);
        onDeleteChat?.(chat);
    };

    useEffect(() => {
        function handleClickOutside(e) {
            if (listRef.current && !listRef.current.contains(e.target)) {
                setOpenMenuChatId(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">{t("chatList.title")}</div>

            <div className="search">
                <div className="search-input-wrap">
                    <input
                        type="text"
                        placeholder={t("chatList.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery("")}
                            type="button"
                            aria-label={t("chatList.clearSearch")}
                            title={t("chatList.clearSearch")}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-list" ref={listRef}>
                {filteredChats.length > 0 ? (
                    filteredChats.map((chat) => {
                        const otherUser = chat.otherUser;

                        const otherUserId =
                            typeof otherUser === "string"
                                ? otherUser
                                : otherUser?._id;

                        const isOnline = onlineUsers?.some(
                            (id) => id?.toString() === otherUserId?.toString()
                        );

                        const isTyping = (typingByChat?.[chat._id] || []).length > 0;
                        const previewText = getPreviewText(chat);

                        const isSelected =
                            selectedChatId?.toString() === chat._id?.toString();

                        const isUnread =
                            !!chat.unread || (chat.unreadCount || 0) > 0;

                        const lastSenderId =
                            typeof chat.lastSender === "string"
                                ? chat.lastSender
                                : chat.lastSender?._id;

                        const isMyLastMessage =
                            lastSenderId?.toString() === myId?.toString();

                        const readByOther =
                            Array.isArray(chat.lastMessageReadBy) &&
                            otherUserId &&
                            chat.lastMessageReadBy.some(
                                (id) => id?.toString() === otherUserId?.toString()
                            );

                        const showSeenAvatar =
                            isMyLastMessage &&
                            readByOther &&
                            !isUnread &&
                            !!otherUserId;

                        const displayName =
                            otherUser?.name ||
                            otherUser?.username ||
                            t("chatList.unknownUser");

                        const avatarSrc = otherUser?.photo
                            ? otherUser.photo.startsWith("http")
                                ? otherUser.photo
                                : `${API_URL}${otherUser.photo}`
                            : "/default-avatar.png";

                        const isMenuOpen = openMenuChatId === chat._id;

                        return (
                            <div
                                key={chat._id}
                                className={`chat-item ${isSelected ? "active" : ""} ${isUnread ? "unread" : ""
                                    }`}
                                onClick={() => {
                                    setOpenMenuChatId(null);
                                    onSelectChat(chat);
                                }}
                            >
                                <div className="chat-avatar-wrap">
                                    <img src={avatarSrc} alt={displayName} />
                                    {isOnline && <span className="online-dot"></span>}
                                </div>

                                <div className="chat-content">
                                    <div className="chat-top-row">
                                        <div className="chat-name">{displayName}</div>

                                        <div
                                            className="chat-item-actions"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                className={`chat-item-menu-btn ${isMenuOpen ? "open" : ""
                                                    }`}
                                                onClick={(e) =>
                                                    handleToggleMenu(e, chat._id)
                                                }
                                                aria-label={t("chatList.moreOptions")}
                                                title={t("chatList.moreOptions")}
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {isMenuOpen && (
                                                <div className="chat-item-menu">
                                                    <button
                                                        type="button"
                                                        className="chat-item-menu-option delete"
                                                        onClick={(e) =>
                                                            handleDeleteClick(e, chat)
                                                        }
                                                    >
                                                        <Trash2 size={15} />
                                                        <span>
                                                            {t("chatList.deleteChat")}
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chat-bottom-row">
                                        <div
                                            className={`chat-message ${isTyping ? "typing-label" : ""
                                                }`}
                                            title={previewText}
                                        >
                                            {previewText}
                                        </div>

                                        <div className="chat-meta-right">
                                            <span className="chat-time">
                                                {chat.lastMessageAt
                                                    ? dayjs(chat.lastMessageAt).format("h:mm A")
                                                    : ""}
                                            </span>

                                            {showSeenAvatar && (
                                                <img
                                                    src={avatarSrc}
                                                    alt={t("chatList.seen")}
                                                    className="chat-seen-avatar"
                                                />
                                            )}

                                            {chat.unreadCount > 0 && (
                                                <span className="unread-badge">
                                                    {chat.unreadCount > 99
                                                        ? "99+"
                                                        : chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="chat-empty-state">
                        <p>
                            {searchQuery.trim()
                                ? t("chatList.noChatsFound")
                                : t("chatList.noChatsYet")}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
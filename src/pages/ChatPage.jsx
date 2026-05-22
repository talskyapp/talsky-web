import { useEffect, useState, useMemo, useRef } from "react";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useLocation, useOutletContext } from "react-router-dom";
import useSubscription from "../hooks/useSubscription";
import { useTranslation } from "../hooks/useTranslation";
import UpgradeModal from "../components/subscription/UpgradeModal";
import "../styles/chat.css";

export default function ChatPage({ socketReady }) {
    const location = useLocation();
    const { setChatId } = useOutletContext();
    const { t } = useTranslation();

    const openChatIdFromProfile = location.state?.openChatId;
    const tempChatUserFromProfile = location.state?.tempChatUser;

    const [chats, setChats] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [lastActiveChatId, setLastActiveChatId] = useState(
        localStorage.getItem("lastActiveChatId") || null
    );
    const [messages, setMessages] = useState([]);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [typingByChat, setTypingByChat] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [windowFocused, setWindowFocused] = useState(true);
    const [newMessageSignal, setNewMessageSignal] = useState(0);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    const [chatErrorMessage, setChatErrorMessage] = useState("");
    const [showChatErrorOverlay, setShowChatErrorOverlay] = useState(false);

    const [deleteChatTarget, setDeleteChatTarget] = useState(null);
    const [deletingChat, setDeletingChat] = useState(false);

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeData, setUpgradeData] = useState({
        title: "Upgrade to Pro",
        message: "Unlock premium features",
        featureList: [],
    });

    

    const {
        subscription,
        usage,
        isPro,
        features,
        refreshSubscription,
    } = useSubscription();

    const token = localStorage.getItem("token");
    const myId = token ? JSON.parse(atob(token.split(".")[1])).id : null;
    const API_URL = import.meta.env.VITE_API_URL;

    const selectedChatRef = useRef(null);
    const windowFocusedRef = useRef(true);
    const chatErrorTimerRef = useRef(null);

    const openUpgrade = ({
        title = "Upgrade to Pro",
        message = "Unlock premium features",
        featureList = [],
    } = {}) => {
        setUpgradeData({ title, message, featureList });
        setShowUpgradeModal(true);
    };

    const handleUpgrade = () => {
        window.location.href = "/pricing";
    };

    const showChatError = (message) => {
        setChatErrorMessage(message || "You can’t send messages in this chat");
        setShowChatErrorOverlay(true);

        if (chatErrorTimerRef.current) {
            clearTimeout(chatErrorTimerRef.current);
        }

        chatErrorTimerRef.current = setTimeout(() => {
            setShowChatErrorOverlay(false);
        }, 2400);
    };

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        windowFocusedRef.current = windowFocused;
    }, [windowFocused]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        return () => {
            if (chatErrorTimerRef.current) {
                clearTimeout(chatErrorTimerRef.current);
            }
        };
    }, []);

    /* ============================
       WINDOW FOCUS
    ============================ */
    useEffect(() => {
        const onFocus = () => setWindowFocused(true);
        const onBlur = () => setWindowFocused(false);

        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    /* ============================
       LOAD USERS
    ============================ */
    useEffect(() => {
        if (!token) return;

        fetch(`${API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setAllUsers(data))
            .catch(() => { });
    }, [token, API_URL]);

    /* ============================
       LOAD CHATS
    ============================ */
    useEffect(() => {
        if (!token) return;

        fetch(`${API_URL}/api/chats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                const filtered = Array.isArray(data) ? data : [];

                const normalized = filtered.map((chat) => {
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
                        unreadCount: chat.unreadCount || 0,
                    };
                });

                setChats(normalized);
            })
            .catch(() => { });
    }, [token, myId, API_URL]);

    /* ============================
       SOCKET: ONLINE USERS
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleOnlineUsers = (users) => {
            setOnlineUsers(users || []);
        };

        window.socket.on("online_users", handleOnlineUsers);
        return () => window.socket.off("online_users", handleOnlineUsers);
    }, [socketReady]);

    /* ============================
       SIDEBAR EVENTS
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleSidebarChatUpdated = ({
            chatId,
            lastMessage,
            lastSender,
            lastMessageAt,
            lastMessageReadBy,
        }) => {
            setChats((prev) => {
                let updated = [...prev];
                const exists = updated.some(
                    (c) => c._id?.toString() === chatId?.toString()
                );

                const readByMe =
                    Array.isArray(lastMessageReadBy) &&
                    lastMessageReadBy.some(
                        (id) => id?.toString() === myId?.toString()
                    );

                if (!exists) return prev;

                updated = updated.map((chat) =>
                    chat._id?.toString() === chatId?.toString()
                        ? {
                            ...chat,
                            lastMessage,
                            lastSender,
                            lastMessageAt,
                            lastMessageReadBy,
                            unread:
                                lastSender?.toString() !== myId?.toString() &&
                                !readByMe,
                        }
                        : chat
                );

                updated.sort(
                    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                );
                return updated;
            });
        };

        const handleSidebarTyping = ({ chatId, userId }) => {
            setTypingByChat((prev) => {
                const currentUsers = prev[chatId] || [];
                if (currentUsers.includes(userId)) return prev;

                return {
                    ...prev,
                    [chatId]: [...currentUsers, userId],
                };
            });
        };

        const handleSidebarStopTyping = ({ chatId, userId }) => {
            setTypingByChat((prev) => {
                const currentUsers = prev[chatId] || [];
                const updatedUsers = currentUsers.filter((id) => id !== userId);
                const next = { ...prev };

                if (updatedUsers.length) next[chatId] = updatedUsers;
                else delete next[chatId];

                return next;
            });
        };

        window.socket.on("sidebar_chat_updated", handleSidebarChatUpdated);
        window.socket.on("sidebar_user_typing", handleSidebarTyping);
        window.socket.on("sidebar_user_stop_typing", handleSidebarStopTyping);

        return () => {
            window.socket.off("sidebar_chat_updated", handleSidebarChatUpdated);
            window.socket.off("sidebar_user_typing", handleSidebarTyping);
            window.socket.off("sidebar_user_stop_typing", handleSidebarStopTyping);
        };
    }, [socketReady, myId]);

    /* ============================
       JOIN CHAT ROOM
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;
        if (!selectedChat?._id) return;

        window.socket.emit("join_chat", selectedChat._id);
    }, [socketReady, selectedChat?._id]);

    /* ============================
       CHAT UPDATED
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleChatUpdated = ({
            chatId,
            lastMessage,
            lastSender,
            lastMessageAt,
            lastMessageReadBy,
        }) => {
            setChats((prev) => {
                let updated = prev.map((chat) => {
                    if (chat._id?.toString() !== chatId?.toString()) return chat;

                    const wasReadByMe =
                        Array.isArray(lastMessageReadBy) &&
                        lastMessageReadBy.some(
                            (id) => id?.toString() === myId?.toString()
                        );

                    return {
                        ...chat,
                        ...(lastMessage !== undefined ? { lastMessage } : {}),
                        ...(lastSender !== undefined ? { lastSender } : {}),
                        ...(lastMessageAt !== undefined ? { lastMessageAt } : {}),
                        ...(lastMessageReadBy !== undefined
                            ? { lastMessageReadBy }
                            : {}),
                        unread:
                            lastSender?.toString() !== myId?.toString() &&
                            !wasReadByMe,
                    };
                });

                updated.sort(
                    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                );

                return updated;
            });
        };

        window.socket.on("chat_updated", handleChatUpdated);
        return () => window.socket.off("chat_updated", handleChatUpdated);
    }, [socketReady, myId]);

    /* ============================
       NEW MESSAGE
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleNewMessage = (msg) => {
            const senderId =
                typeof msg.sender === "string" ? msg.sender : msg.sender?._id;

            const isMine = senderId?.toString() === myId?.toString();
            const currentSelected = selectedChatRef.current;

            const incomingChatId =
                typeof msg.chatId === "string"
                    ? msg.chatId
                    : msg.chatId?._id || msg.chatId;

            const currentSelectedId = currentSelected?._id?.toString();

            const isCurrentChat =
                currentSelectedId === incomingChatId?.toString() ||
                (currentSelected?.isTemporary &&
                    currentSelected?.otherUser?._id?.toString() !== myId?.toString() &&
                    currentSelected?.otherUser?._id?.toString() === senderId?.toString()) ||
                (currentSelected?.isTemporary && isMine);

            const mediaFiles =
                Array.isArray(msg.fileUrls) && msg.fileUrls.length > 0
                    ? msg.fileUrls
                    : msg.fileUrl
                        ? [msg.fileUrl]
                        : [];

            const previewText =
                msg.type === "image"
                    ? mediaFiles.length > 1
                        ? `📷 ${mediaFiles.length} Photos`
                        : "📷 Photo"
                    : msg.type === "video"
                        ? mediaFiles.length > 1
                            ? `🎥 ${mediaFiles.length} Videos`
                            : "🎥 Video"
                        : msg.text || "";

            const shouldMarkUnread =
                !isMine && (!isCurrentChat || !windowFocusedRef.current);

            setMessages((prev) => {
                const tempIndex = prev.findIndex(
                    (m) =>
                        m.tempId?.toString() === msg.tempId?.toString() &&
                        msg.tempId
                );

                if (tempIndex !== -1) {
                    const updated = [...prev];
                    updated[tempIndex] = msg;
                    return updated;
                }

                if (isCurrentChat) {
                    const exists = prev.some(
                        (m) => m._id?.toString() === msg._id?.toString()
                    );
                    if (exists) return prev;
                    return [...prev, msg];
                }

                return prev;
            });

            setChats((prev) => {
                let updated = [...prev];

                const exists = updated.some(
                    (c) => c._id?.toString() === incomingChatId?.toString()
                );

                const fallbackOtherUser = currentSelected?.otherUser || null;

                const incomingUsers =
                    Array.isArray(msg.users) && msg.users.length > 0
                        ? msg.users
                        : fallbackOtherUser
                            ? [fallbackOtherUser]
                            : [];

                const tempChatIndex = updated.findIndex((chat) => {
                    if (!chat?.isTemporary) return false;

                    const tempOtherId =
                        chat?.otherUser?._id?.toString() ||
                        (Array.isArray(chat.users)
                            ? chat.users
                                .map((u) =>
                                    typeof u === "string"
                                        ? u
                                        : u?._id?.toString()
                                )
                                .find((id) => id && id !== myId?.toString())
                            : null);

                    const incomingOtherId =
                        fallbackOtherUser?._id?.toString() ||
                        (Array.isArray(incomingUsers)
                            ? incomingUsers
                                .map((u) =>
                                    typeof u === "string"
                                        ? u
                                        : u?._id?.toString()
                                )
                                .find((id) => id && id !== myId?.toString())
                            : null);

                    return (
                        tempOtherId &&
                        incomingOtherId &&
                        tempOtherId === incomingOtherId
                    );
                });

                if (!exists) {
                    const newChat = {
                        _id: incomingChatId,
                        users: incomingUsers,
                        otherUser: fallbackOtherUser,
                        isTemporary: false,
                        lastMessage: previewText,
                        lastSender: senderId,
                        lastMessageAt: msg.createdAt,
                        lastMessageReadBy: isMine ? [myId] : [],
                        unread: shouldMarkUnread,
                        unreadCount: !isMine ? 1 : 0,
                    };

                    if (tempChatIndex !== -1) {
                        updated[tempChatIndex] = {
                            ...updated[tempChatIndex],
                            ...newChat,
                        };
                    } else {
                        updated = [newChat, ...updated];
                    }
                } else {
                    updated = updated.map((chat) => {
                        if (chat._id?.toString() !== incomingChatId?.toString()) {
                            return chat;
                        }

                        return {
                            ...chat,
                            isTemporary: false,
                            lastMessage: previewText,
                            lastSender: senderId,
                            lastMessageAt: msg.createdAt,
                            lastMessageReadBy: isMine ? [myId] : [],
                            unread: shouldMarkUnread,
                            unreadCount: shouldMarkUnread
                                ? (chat.unreadCount || 0) + 1
                                : 0,
                        };
                    });
                }

                updated.sort(
                    (a, b) =>
                        new Date(b.lastMessageAt || 0) -
                        new Date(a.lastMessageAt || 0)
                );

                return updated;
            });

            setSelectedChat((prev) => {
                if (!prev) return prev;

                if (
                    prev.isTemporary ||
                    prev._id?.toString() === incomingChatId?.toString()
                ) {
                    return {
                        ...prev,
                        _id: incomingChatId,
                        isTemporary: false,
                    };
                }

                return prev;
            });

            setChatId(incomingChatId);
            setLastActiveChatId(incomingChatId);
            localStorage.setItem("lastActiveChatId", incomingChatId);

            if (!isMine && isCurrentChat) {
                setNewMessageSignal((prev) => prev + 1);
            }
        };

        window.socket.on("new_message", handleNewMessage);
        return () => window.socket.off("new_message", handleNewMessage);
    }, [socketReady, myId, setChatId]);

    /* ============================
       MESSAGES READ
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleMessagesRead = ({ chatId, readAt }) => {
            if (!chatId || !readAt) return;

            if (selectedChatRef.current?._id?.toString() === chatId?.toString()) {
                setMessages((prev) =>
                    prev.map((m) => {
                        const senderId =
                            typeof m.sender === "string" ? m.sender : m.sender?._id;

                        if (senderId?.toString() === myId?.toString() && !m.readAt) {
                            return { ...m, readAt };
                        }

                        return m;
                    })
                );
            }

            setChats((prev) =>
                prev.map((chat) =>
                    chat._id?.toString() === chatId?.toString()
                        ? {
                            ...chat,
                            unread: false,
                            unreadCount: 0,
                        }
                        : chat
                )
            );
        };

        window.socket.on("messages_read", handleMessagesRead);
        return () => window.socket.off("messages_read", handleMessagesRead);
    }, [socketReady, myId]);

    /* ============================
       TYPING INDICATORS
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleTyping = ({ chatId, userId }) => {
            if (!chatId || !userId) return;

            setTypingByChat((prev) => {
                const currentUsers = prev[chatId] || [];

                if (currentUsers.includes(userId)) return prev;

                return {
                    ...prev,
                    [chatId]: [...currentUsers, userId],
                };
            });
        };

        const handleStopTyping = ({ chatId, userId }) => {
            if (!chatId || !userId) return;

            setTypingByChat((prev) => {
                const currentUsers = prev[chatId] || [];
                const updatedUsers = currentUsers.filter((id) => id !== userId);

                const next = { ...prev };

                if (updatedUsers.length > 0) {
                    next[chatId] = updatedUsers;
                } else {
                    delete next[chatId];
                }

                return next;
            });
        };

        window.socket.on("user_typing", handleTyping);
        window.socket.on("user_stop_typing", handleStopTyping);

        return () => {
            window.socket.off("user_typing", handleTyping);
            window.socket.off("user_stop_typing", handleStopTyping);
        };
    }, [socketReady]);

    /* ============================
       AUTO READ WHEN CHAT IS OPEN
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;
        if (!selectedChat?._id) return;
        if (!messages.length) return;

        const lastMessage = messages[messages.length - 1];

        const senderId =
            typeof lastMessage.sender === "string"
                ? lastMessage.sender
                : lastMessage.sender?._id;

        const isMine = senderId?.toString() === myId?.toString();

        if (isMine) return;
        if (lastMessage.readAt) return;

        const lastChatId =
            lastMessage.chatId?.toString() || selectedChat._id?.toString();

        if (lastChatId !== selectedChat._id?.toString()) return;

        window.socket.emit("mark_as_read", {
            chatId: selectedChat._id,
        });
    }, [messages, selectedChat?._id, socketReady, myId]);

    /* ============================
       ENRICH CHATS
    ============================ */
    const enrichedChats = useMemo(() => {
        return chats.map((chat) => {
            const userIds = (chat.users || []).map((u) =>
                typeof u === "string" ? u : u?._id
            );

            const otherId = userIds.find(
                (id) => id?.toString() !== myId?.toString()
            );

            const otherUser =
                allUsers.find((u) => u._id?.toString() === otherId?.toString()) ||
                chat.otherUser ||
                null;

            return {
                ...chat,
                otherUser,
            };
        });
    }, [chats, allUsers, myId]);

    const loadOlderMessages = async () => {
        if (!selectedChat?._id || !token) return;
        if (loadingOlderMessages || !hasMoreMessages) return;
        if (!messages.length) return;

        try {
            setLoadingOlderMessages(true);

            const oldestMessage = messages[0];

            const res = await fetch(
                `${API_URL}/api/messages/${selectedChat._id}?limit=20&before=${encodeURIComponent(oldestMessage.createdAt)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            const olderMessages = Array.isArray(data.messages) ? data.messages : [];

            if (loadingOlderRef.current) return;

            setMessages((prev) => {
                const existingIds = new Set(
                    prev.map((m) => String(m._id || m.tempId))
                );

                const cleanOlder = olderMessages.filter(
                    (m) => !existingIds.has(String(m._id || m.tempId))
                );

                return [...cleanOlder, ...prev];
            });

            setHasMoreMessages(!!data.hasMore);
        } catch (error) {
            console.error("LOAD OLDER MESSAGES ERROR:", error);
        } finally {
            setLoadingOlderMessages(false);
        }
    };

    /* ============================
       OPEN CHAT
    ============================ */
    const openChat = async (chat) => {
        if (!chat) return;

        if (chat?.isTemporary && subscription?.plan === "free") {
            if ((usage?.newChatsRemaining ?? 0) <= 0) {
                openUpgrade({
                    title: "Daily limit reached",
                    message: "You reached your daily limit of 5 new chats.",
                    featureList: [
                        "Unlimited chats",
                        "Nearby",
                        "Advanced filters",
                        "All courses unlocked",
                    ],
                });
                return;
            }
        }

        const currentSelected = selectedChatRef.current;

        const isSameChat =
            currentSelected?._id?.toString() === chat._id?.toString() ||
            (currentSelected?.isTemporary &&
                !chat?._id &&
                currentSelected?.otherUser?._id?.toString() ===
                chat?.otherUser?._id?.toString());

        setLastActiveChatId(chat._id || null);

        if (chat._id) {
            localStorage.setItem("lastActiveChatId", chat._id);
        }

        setSelectedChat(chat);
        setChatId(chat._id || "temp-chat");

        if (!isSameChat) {
            setMessages([]);
        }

        if (!chat?._id) {
            return;
        }

        try {
            const res = await fetch(
                `${API_URL}/api/messages/${chat._id}?limit=20`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            setMessages(
                data.messages.map((m) => {
                    const senderId =
                        typeof m.sender === "string"
                            ? m.sender
                            : m.sender?._id;

                    return {
                        ...m,
                        text: m.unsent
                            ? senderId?.toString() === myId?.toString()
                                ? "You unsent a message"
                                : "Message removed"
                            : m.text,
                    };
                })
            );

            setHasMoreMessages(data.hasMore);

            if (window.socket) {
                window.socket.emit("mark_as_read", {
                    chatId: chat._id,
                });
            }
        } catch (error) {
            console.error("Error opening chat:", error);
        }
    };

    /* ============================
       AUTO OPEN CHAT
    ============================ */
    useEffect(() => {
        if (!socketReady) return;
        if (isMobileView && !openChatIdFromProfile) return;
        if (selectedChat) return;

        if (openChatIdFromProfile) {
            const target = enrichedChats.find(
                (c) => c._id?.toString() === openChatIdFromProfile?.toString()
            );

            if (target) {
                openChat(target);
                return;
            }
        }

        if (enrichedChats.length === 0) return;

        if (isMobileView) return;

        if (lastActiveChatId) {
            const lastActive = enrichedChats.find(
                (c) => c._id?.toString() === lastActiveChatId?.toString()
            );

            if (lastActive) {
                openChat(lastActive);
                return;
            }
        }

        const lastSentByMe = [...enrichedChats]
            .filter((c) => c.lastSender?.toString() === myId?.toString())
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))[0];

        if (lastSentByMe) {
            openChat(lastSentByMe);
        }
    }, [
        socketReady,
        enrichedChats,
        openChatIdFromProfile,
        selectedChat,
        lastActiveChatId,
        myId,
        isMobileView,
        subscription?.plan,
        usage?.newChatsRemaining,
    ]);

    /* ============================
       CLEAR SELECTED CHAT WHEN SWITCHING TO MOBILE
    ============================ */
    useEffect(() => {
        if (!isMobileView) return;
        if (openChatIdFromProfile) return;
        if (tempChatUserFromProfile?._id) return;

        setSelectedChat((prev) => {
            if (!prev?._id) return prev;
            setChatId(null);
            return null;
        });
    }, [isMobileView, openChatIdFromProfile, tempChatUserFromProfile, setChatId]);

    /* ============================
       KEEP SELECTED CHAT FRESH
    ============================ */
    useEffect(() => {
        if (!selectedChat?._id) return;

        const freshSelected = enrichedChats.find(
            (c) => c._id?.toString() === selectedChat._id?.toString()
        );

        if (freshSelected) {
            setSelectedChat((prev) => {
                if (!prev) return freshSelected;
                return {
                    ...prev,
                    ...freshSelected,
                };
            });
        }
    }, [enrichedChats, selectedChat?._id]);

    /* ============================
       MESSAGE UNSENT
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleMessageUnsent = ({
            chatId,
            lastMessage,
            lastSender,
            lastMessageReadBy,
            messageId,
        }) => {
            if (!messageId) return;

            if (selectedChatRef.current?._id?.toString() === chatId?.toString()) {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m._id?.toString() !== messageId?.toString()) return m;

                        const senderId =
                            typeof m.sender === "string"
                                ? m.sender
                                : m.sender?._id;

                        const isMine = senderId?.toString() === myId?.toString();

                        return {
                            ...m,
                            unsent: true,
                            text: isMine ? "You unsent a message" : "Message removed",
                        };
                    })
                );
            }

            setChats((prev) =>
                prev.map((chat) =>
                    chat._id?.toString() === chatId?.toString()
                        ? {
                            ...chat,
                            lastMessage,
                            lastSender,
                            lastMessageReadBy,
                        }
                        : chat
                )
            );
        };

        window.socket.on("message_unsent", handleMessageUnsent);
        return () => window.socket.off("message_unsent", handleMessageUnsent);
    }, [socketReady, myId]);

    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleMessageEdited = ({
            chatId,
            messageId,
            text,
            edited,
            lastMessage,
            lastMessageAt,
        }) => {
            if (!messageId) return;

            if (selectedChatRef.current?._id?.toString() === chatId?.toString()) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m._id?.toString() === messageId?.toString()
                            ? {
                                ...m,
                                text,
                                edited: edited ?? true,
                            }
                            : m
                    )
                );
            }

            setChats((prev) =>
                prev.map((chat) =>
                    chat._id?.toString() === chatId?.toString()
                        ? {
                            ...chat,
                            ...(lastMessage !== undefined ? { lastMessage } : {}),
                            ...(lastMessageAt !== undefined ? { lastMessageAt } : {}),
                        }
                        : chat
                )
            );
        };

        window.socket.on("message_edited", handleMessageEdited);
        return () => window.socket.off("message_edited", handleMessageEdited);
    }, [socketReady]);

    /* ============================
       SEND MESSAGE
    ============================ */
    const sendMessage = ({ text, replyTo, tempId }) => {
        if (!text || typeof text !== "string") return;
        if (!window.socket) return;

        setLastActiveChatId(selectedChat?._id || "temp-chat");
        if (selectedChat?._id) {
            localStorage.setItem("lastActiveChatId", selectedChat._id);
        }

        setMessages((prev) => [
            ...prev,
            {
                _id: null,
                tempId: tempId.toString(),
                text,
                type: "text",
                fileUrls: [],
                sender: myId,
                replyTo: replyTo ? { _id: replyTo } : null,
                createdAt: new Date().toISOString(),
                pending: true,
                readAt: null,
            },
        ]);

        window.socket.emit("send_message", {
            chatId: selectedChat?._id || null,
            otherUserId: selectedChat?.otherUser?._id || null,
            text,
            replyTo,
            tempId: tempId.toString(),
        });
    };

    /* ============================
       MESSAGE ERROR
    ============================ */
    useEffect(() => {
        if (!socketReady || !window.socket) return;

        const handleMessageError = ({ tempId, msg, upgradeRequired, feature }) => {
            if (tempId) {
                setMessages((prev) =>
                    prev.filter((m) => m.tempId?.toString() !== tempId?.toString())
                );
            }

            if (upgradeRequired) {
                openUpgrade({
                    title:
                        feature === "multimediaMessages"
                            ? "Premium feature"
                            : "Upgrade to Pro",
                    message: msg || "This feature requires Pro.",
                    featureList: [
                        "Unlimited chats",
                        "Multimedia messages",
                        "Nearby",
                        "Advanced filters",
                    ],
                });
                refreshSubscription();
                return;
            }

            showChatError(msg || "You can’t send messages in this chat");
        };

        window.socket.on("message_error", handleMessageError);

        return () => {
            window.socket.off("message_error", handleMessageError);
        };
    }, [socketReady, refreshSubscription]);

    /* ============================
       EDIT MESSAGE
    ============================ */
    const editMessage = async (messageId, newText) => {
        if (!messageId || !newText?.trim() || !token) return;

        const trimmed = newText.trim();

        setMessages((prev) =>
            prev.map((m) =>
                m._id?.toString() === messageId?.toString()
                    ? {
                        ...m,
                        text: trimmed,
                        edited: true,
                    }
                    : m
            )
        );

        setChats((prev) =>
            prev.map((chat) => {
                const isSelected =
                    chat._id?.toString() === selectedChatRef.current?._id?.toString();

                if (!isSelected) return chat;

                return {
                    ...chat,
                    lastMessage: trimmed,
                };
            })
        );

        try {
            const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: trimmed }),
            });

            if (!res.ok) {
                throw new Error("Failed to edit message");
            }
        } catch (error) {
            console.error("Error editing message:", error);
        }
    };

    /* ============================
       UNSEND MESSAGE
    ============================ */
    const unsendMessage = async (messageId) => {
        if (!messageId || !token) return;

        setMessages((prev) =>
            prev.map((m) => {
                if (m._id?.toString() !== messageId?.toString()) return m;

                const senderId =
                    typeof m.sender === "string" ? m.sender : m.sender?._id;

                const isMine = senderId?.toString() === myId?.toString();

                return {
                    ...m,
                    unsent: true,
                    text: isMine ? "You unsent a message" : "Message removed",
                };
            })
        );

        try {
            const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error("Failed to unsend message");
            }
        } catch (error) {
            console.error("Error unsending message:", error);
        }
    };

    const handleDeleteChat = (chat) => {
        setDeleteChatTarget(chat);
    };

    const confirmDeleteChat = async () => {
        if (!deleteChatTarget?._id || deletingChat) return;

        try {
            setDeletingChat(true);

            const res = await fetch(
                `${API_URL}/api/chats/${deleteChatTarget._id}/delete-for-me`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.msg || "Could not delete chat");
            }

            setChats((prev) =>
                prev.filter((chat) => chat._id !== deleteChatTarget._id)
            );

            if (selectedChat?._id === deleteChatTarget._id) {
                setSelectedChat(null);
                setMessages([]);
                setChatId(null);
            }

            setDeleteChatTarget(null);
        } catch (error) {
            console.error("Delete chat error:", error);
            alert(error.message);
        } finally {
            setDeletingChat(false);
        }
    };

    const closeDeleteChatModal = () => {
        if (deletingChat) return;
        setDeleteChatTarget(null);
    };

    /* ============================
       DELETE FOR ME
    ============================ */
    const deleteMessageForMe = async (messageId) => {
        if (!messageId || !token) return;

        try {
            const res = await fetch(
                `${API_URL}/api/messages/${messageId}/delete-for-me`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || "Failed to delete message for me");
            }

            setMessages((prev) =>
                prev.filter((m) => m._id?.toString() !== messageId?.toString())
            );
        } catch (error) {
            console.error("Error deleting message for me:", error.message);
        }
    };

    /* ============================
       AUTO OPEN TEMP CHAT FROM PROFILE
    ============================ */
    useEffect(() => {
        if (!tempChatUserFromProfile?._id) return;

        // 🔥 si ya viene un chat real desde perfil, NO crear temporal
        if (openChatIdFromProfile) return;

        if (selectedChat?._id || selectedChat?.isTemporary) return;

        setSelectedChat({
            _id: null,
            users: [tempChatUserFromProfile],
            otherUser: tempChatUserFromProfile,
            isTemporary: true,
            lastMessage: "",
            lastMessageAt: null,
            unread: false,
            unreadCount: 0,
        });

        setChatId("temp-chat");
        setMessages([]);
    }, [
        tempChatUserFromProfile,
        openChatIdFromProfile,
        selectedChat?._id,
        selectedChat?.isTemporary,
        setChatId,
    ]);

    const handleBack = () => {
        setSelectedChat(null);
        setChatId(null);
    };

    return (
        <div className="chat-wrapper">
            <div className={`container ${isMobileView ? "mobile-container" : ""}`}>
                {isMobileView ? (
                    <>
                        <div
                            className={`mobile-chat-list-layer ${selectedChat ? "behind-chat" : "visible"
                                }`}
                        >
                            <ChatList
                                chats={enrichedChats}
                                myId={myId}
                                onlineUsers={onlineUsers}
                                typingByChat={typingByChat}
                                onSelectChat={openChat}
                                selectedChatId={selectedChat?._id}
                                onDeleteChat={handleDeleteChat}
                            />
                        </div>

                        {selectedChat && (
                            <div className="mobile-chat-window-layer">
                                <ChatWindow
                                    key={
                                        selectedChat?._id ||
                                        selectedChat?.otherUser?._id ||
                                        "temp-chat"
                                    }
                                    chat={selectedChat}
                                    messages={messages}
                                    myId={myId}
                                    onlineUsers={onlineUsers}
                                    onSend={sendMessage}
                                    onUnsend={unsendMessage}
                                    onEdit={editMessage}
                                    onDeleteForMe={deleteMessageForMe}
                                    typingUsers={typingByChat[selectedChat?._id] || []}
                                    newMessageSignal={newMessageSignal}
                                    onBack={handleBack}
                                    isMobileView={isMobileView}
                                    showChatErrorOverlay={showChatErrorOverlay}
                                    chatErrorMessage={chatErrorMessage}
                                    isPro={isPro}
                                    features={features}
                                    onOpenUpgrade={openUpgrade}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="chat-sidebar-area">

                            <ChatList
                                chats={enrichedChats}
                                myId={myId}
                                onlineUsers={onlineUsers}
                                typingByChat={typingByChat}
                                onSelectChat={openChat}
                                selectedChatId={selectedChat?._id}
                                onDeleteChat={handleDeleteChat}
                            />
                        </div>

                        <ChatWindow
                            key={
                                selectedChat?._id ||
                                selectedChat?.otherUser?._id ||
                                "temp-chat"
                            }
                            chat={selectedChat}
                            messages={messages}
                            hasMoreMessages={hasMoreMessages}
                            loadingOlderMessages={loadingOlderMessages}
                            onLoadOlderMessages={loadOlderMessages}
                            myId={myId}
                            onlineUsers={onlineUsers}
                            onSend={sendMessage}
                            onUnsend={unsendMessage}
                            onEdit={editMessage}
                            onDeleteForMe={deleteMessageForMe}
                            typingUsers={typingByChat[selectedChat?._id] || []}
                            newMessageSignal={newMessageSignal}
                            onBack={handleBack}
                            isMobileView={isMobileView}
                            showChatErrorOverlay={showChatErrorOverlay}
                            chatErrorMessage={chatErrorMessage}
                            isPro={isPro}
                            features={features}
                            onOpenUpgrade={openUpgrade}
                        />
                    </>
                )}
            </div>

            {deleteChatTarget && (
                <div
                    className="confirm-modal-overlay"
                    onClick={closeDeleteChatModal}
                >
                    <div
                        className="confirm-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="confirm-modal-avatar">
                            <img
                                src={
                                    deleteChatTarget?.otherUser?.photo
                                        ? deleteChatTarget.otherUser.photo.startsWith("http")
                                            ? deleteChatTarget.otherUser.photo
                                            : `${API_URL}${deleteChatTarget.otherUser.photo}`
                                        : "/default-avatar.png"
                                }
                                alt={
                                    deleteChatTarget?.otherUser?.name ||
                                    deleteChatTarget?.otherUser?.username ||
                                    t("chatList.userFallback")
                                }
                            />
                        </div>

                        <h3>{t("chatList.deleteChatTitle")}</h3>
                        <p>{t("chatList.deleteChatDescription")}</p>

                        <div className="confirm-modal-actions">
                            <button
                                className="confirm-btn"
                                onClick={closeDeleteChatModal}
                                disabled={deletingChat}
                            >
                                {t("chatList.cancel")}
                            </button>

                            <button
                                className="confirm-btn danger"
                                onClick={confirmDeleteChat}
                                disabled={deletingChat}
                            >
                                {deletingChat
                                    ? t("chatList.deletingChat")
                                    : t("chatList.confirmDelete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <UpgradeModal
                open={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgrade={handleUpgrade}
                title={upgradeData.title}
                message={upgradeData.message}
                featureList={upgradeData.featureList}
            />
        </div>
    );
}
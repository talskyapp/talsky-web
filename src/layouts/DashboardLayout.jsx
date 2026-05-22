import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../lib/config";
import { apiClient } from "../lib/apiClient";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import UserNavbar from "../components/UserNavbar";
import GlobalSocketListeners from "../components/GlobalSocketListeners";

export default function DashboardLayout() {
    const [user, setUser] = useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    });

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [highlightedMessage, setHighlightedMessage] = useState(null);
    const [repliedMessage, setRepliedMessage] = useState(null);
    const [menuMessageId, setMenuMessageId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [lastMyMessageId, setLastMyMessageId] = useState(null);
    const [lastMyReadMessageId, setLastMyReadMessageId] = useState(null);
    const [chatId, setChatId] = useState(null);

    const [chatToast, setChatToast] = useState(null);
    const toastTimeoutRef = useRef(null);
    const socketReadyRef = useRef(false);

    const hasAutoUpdatedLocation = useRef(false);

    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem("token");
    const myId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

    const isLessonPage = location.pathname.match(/\/lesson(\/|$)/);
    const isChatPage =
        location.pathname.includes("/chat") ||
        location.pathname.includes("/messages");

    const isOnline = (userId) => {
        return window.onlineUsers?.includes(userId);
    };

    const getLastActiveShort = (date) => {
        if (!date) return "—";
        return dayjs(date).format("LT");
    };

    const showChatToast = (message) => {
        setChatToast({
            id: message._id || Date.now(),
            chatId: message.chatId?._id || message.chatId,
            senderName:
                message.sender?.name ||
                message.sender?.username ||
                "Someone",
            senderPhoto: message.sender?.photo
                ? message.sender.photo.startsWith("http")
                    ? message.sender.photo
                    : `${API_URL}${message.sender.photo}`
                : "/default-avatar.png",
            text: message.unsent
                ? "Message removed"
                : message.text || "Sent you a message",
        });

        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        toastTimeoutRef.current = setTimeout(() => {
            setChatToast(null);
        }, 3500);
    };

    const formatPreview = (text) => {
        if (!text) return "";
        return text.length > 25 ? text.slice(0, 25) + "…" : text;
    };

    const formatChatTime = (date) => {
        if (!date) return "";
        return dayjs(date).format("LT");
    };

    const formatDateLabel = (date) => {
        if (!date) return "";
        return dayjs(date).format("MMM D");
    };

    const getStatus = (userId) => {
        return isOnline(userId) ? "online" : "offline";
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    // ✅ INIT SOCKET GLOBALLY ON DASHBOARD LOAD
    useEffect(() => {
        if (!token) return;

        if (!window.socket) {
            window.socket = io(API_URL, {
                withCredentials: true,
                transports: ["websocket", "polling"],
            });
        }

        const socket = window.socket;

        const handleConnect = () => {
            socketReadyRef.current = true;
            console.log("Global socket connected:", socket.id);
        };

        const handleDisconnect = () => {
            socketReadyRef.current = false;
            console.log("Global socket disconnected");
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        if (socket.connected) {
            socketReadyRef.current = true;
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
        };
    }, [token]);

    useEffect(() => {
        if (!token || !window.socket) return;

        const fetchChatsAndJoinRooms = async () => {
            try {
                const res = await apiClient.get("/api/chats");

                const chatList = Array.isArray(res.data) ? res.data : [];
                setChats(chatList);

                chatList.forEach((chat) => {
                    if (chat?._id) {
                        window.socket.emit("join_chat", chat._id);
                    }
                });
            } catch (error) {
                console.error("Error loading chats for socket rooms:", error);
            }
        };

        fetchChatsAndJoinRooms();
    }, [token]);

    // ✅ GLOBAL TOAST LISTENER
    useEffect(() => {
        const socket = window.socket;
        if (!socket || !user?._id) return;

        const handleNewMessageToast = (message) => {
            const senderId =
                typeof message.sender === "string"
                    ? message.sender
                    : message.sender?._id;

            const isMine = senderId?.toString() === user._id?.toString();
            if (isMine) return;

            const incomingChatId = message.chatId?._id || message.chatId;
            const currentChatId = chatId;

            const isOnChatRoute =
                location.pathname.includes("/chat") ||
                location.pathname.includes("/messages");

            const isSameChat =
                incomingChatId?.toString() === currentChatId?.toString();

            if (!isOnChatRoute || !isSameChat) {
                showChatToast(message);
            }
        };

        socket.on("new_message", handleNewMessageToast);

        return () => {
            socket.off("new_message", handleNewMessageToast);
        };
    }, [chatId, user?._id, location.pathname]);

    useEffect(() => {
        const isOnChatRoute =
            location.pathname.includes("/chat") ||
            location.pathname.includes("/messages");

        if (!isOnChatRoute) {
            setChatId(null);
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }
    }, [user]);

    useEffect(() => {
        if (user?.nativeLanguage) {
            localStorage.setItem("nativeLanguage", user.nativeLanguage);
        }
    }, [user]);

    useEffect(() => {
        if (!token) return;

        const fetchFreshUser = async () => {
            try {
                const res = await apiClient.get("/api/auth/me");

                if (res.data?.user) {
                    setUser(res.data.user);
                }
            } catch (err) {
                console.error("Error refreshing dashboard user:", err);
            }
        };

        fetchFreshUser();
    }, [token]);

    useEffect(() => {
        if (!user?.locationPermission) return;
        if (!navigator.geolocation) return;
        if (hasAutoUpdatedLocation.current) return;

        hasAutoUpdatedLocation.current = true;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    const currentLat = Number(user?.location?.lat);
                    const currentLng = Number(user?.location?.lng);

                    const hasMoved =
                        !Number.isFinite(currentLat) ||
                        !Number.isFinite(currentLng) ||
                        Math.abs(currentLat - latitude) > 0.01 ||
                        Math.abs(currentLng - longitude) > 0.01;

                    const hasCity = !!String(user?.location?.city || "").trim();
                    const hasCountry = !!String(user?.location?.country || "").trim();

                    const needsMissingData = !hasCity || !hasCountry;

                    if (!hasMoved && !needsMissingData) return;

                    const token = localStorage.getItem("token");
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                    let city = "";
                    let country = "";

                    const geoRes = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                    );

                    const geoData = await geoRes.json();
                    const address = geoData.results?.[0]?.address_components || [];

                    city =
                        address.find((a) => a.types.includes("locality"))?.long_name ||
                        address.find((a) => a.types.includes("sublocality"))?.long_name ||
                        address.find((a) =>
                            a.types.includes("administrative_area_level_2")
                        )?.long_name ||
                        address.find((a) =>
                            a.types.includes("administrative_area_level_1")
                        )?.long_name ||
                        "";

                    country =
                        address.find((a) => a.types.includes("country"))?.long_name || "";

                    const res = await fetch(`${API_URL}/api/users/update-location`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            lat: latitude,
                            lng: longitude,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            city,
                            country,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                        setUser(data.user);
                    } else {
                        hasAutoUpdatedLocation.current = false;
                    }
                } catch (err) {
                    console.error("Auto location update failed:", err);
                    hasAutoUpdatedLocation.current = false;
                }
            },
            (err) => {
                console.warn("Location refresh skipped:", err.code, err.message);
                hasAutoUpdatedLocation.current = false;
            },
            {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 60000,
            }
        );
    }, [
        user?.locationPermission,
        user?.location?.city,
        user?.location?.country,
        user?.location?.lat,
        user?.location?.lng,
    ]);

    // ✅ UPDATE CHAT LIST GLOBALLY TOO
    useEffect(() => {
        const socket = window.socket;
        if (!socket) return;

        const handleNewMessage = (msg) => {
            if (!msg || !msg.sender || typeof msg.sender === "string") {
                return;
            }

            const incomingChatId = msg.chatId?._id || msg.chatId;
            const previewText =
                msg.type === "image" ? "📷 Photo" : (msg.text || "");

            setChats((prev) =>
                prev.map((chat) =>
                    chat._id?.toString() === incomingChatId?.toString()
                        ? {
                            ...chat,
                            lastMessage: previewText,
                            lastSender: msg.sender._id,
                            lastMessageAt: msg.createdAt,
                            lastMessageReadBy: [],
                        }
                        : chat
                )
            );
        };

        socket.on("new_message", handleNewMessage);

        return () => {
            socket.off("new_message", handleNewMessage);
        };
    }, []);

    const hideNavbar = isLessonPage;

    return (
        <div
            className={`dashboard-layout ${isLessonPage ? "lesson-layout" : ""} ${isChatPage ? "chat-layout" : ""
                }`}
        >
            <GlobalSocketListeners setChats={setChats} myId={myId} token={token} />

            {!hideNavbar && (
                <UserNavbar
                    user={user}
                    isMobile={isMobile}
                    isChatPage={isChatPage}
                    chatId={chatId}
                />
            )}

            <main
                className={
                    isLessonPage
                        ? "lesson-content"
                        : isChatPage
                            ? "dashboard-content chat-page-content"
                            : "dashboard-content"
                }
            >
                <Outlet
                    context={{
                        user,
                        setUser,
                        chats,
                        setChats,
                        messages,
                        setMessages,
                        otherUser,
                        setOtherUser,
                        text,
                        setText,
                        replyTo,
                        setReplyTo,
                        showScrollDown,
                        setShowScrollDown,
                        autoScroll,
                        setAutoScroll,
                        selectedMessageId,
                        setSelectedMessageId,
                        highlightedMessage,
                        setHighlightedMessage,
                        repliedMessage,
                        setRepliedMessage,
                        menuMessageId,
                        setMenuMessageId,
                        isTyping,
                        setIsTyping,
                        lastMyMessageId,
                        setLastMyMessageId,
                        lastMyReadMessageId,
                        setLastMyReadMessageId,
                        chatId,
                        setChatId,
                        navigate,
                        myId,
                        formatPreview,
                        formatChatTime,
                        formatDateLabel,
                        isOnline,
                        getLastActiveShort,
                        getStatus,
                    }}
                    key={chats.length}
                />
            </main>

            {chatToast && (
                <button
                    type="button"
                    className="global-chat-toast"
                    onClick={() => {
                        navigate("/dashboard/chat-v2", {
                            state: { openChatId: chatToast.chatId },
                        });
                        setChatToast(null);
                    }}
                >
                    <img
                        src={chatToast.senderPhoto}
                        alt={chatToast.senderName}
                        className="global-chat-toast-avatar"
                    />

                    <div className="global-chat-toast-content">
                        <div className="global-chat-toast-title">
                            {chatToast.senderName} sent a message
                        </div>
                        <div className="global-chat-toast-text">
                            {chatToast.text}
                        </div>
                    </div>
                </button>
            )}
        </div>
    );
}
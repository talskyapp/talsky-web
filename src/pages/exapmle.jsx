import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import "../styles/chat.css";

export default function Chat() {
    const { chats, setChats } = useOutletContext();
    const { chatId } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [repliedMessage, setRepliedMessage] = useState(null);
    const [highlightedMessage, setHighlightedMessage] = useState(null);

    // Removed: focusedReply (iMessage effect)

    const [autoScroll, setAutoScroll] = useState(true);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [currentChat, setCurrentChat] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [cacheReady, setCacheReady] = useState(false);
    const [menuMessageId, setMenuMessageId] = useState(null);

    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const token = localStorage.getItem("token");
    const myId = JSON.parse(atob(token.split(".")[1])).id;

    /* ------------------------------
       Helper functions
    ------------------------------ */

    const isOnline = (lastSeen) => {
        if (!lastSeen) return false;
        const last = new Date(lastSeen);
        const now = new Date();
        return (now - last) / 1000 < 60;
    };

    const getLastActiveShort = (lastSeen) => {
        if (!lastSeen) return null;
        const last = new Date(lastSeen);
        const now = new Date();
        const diff = (now - last) / 1000;
        if (diff < 60) return "now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return null;
    };

    const formatDateLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    };

    const formatChatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const oneDay = 24 * 60 * 60 * 1000;

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        if (diff < 7 * oneDay) {
            return date.toLocaleDateString("en-US", { weekday: "short" });
        }

        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const getStatus = () => {
        if (!otherUser?.lastSeen) return "Unknown";
        const last = new Date(otherUser.lastSeen);
        const now = new Date();
        const diff = (now - last) / 1000;
        if (diff < 60) return "Active now";
        if (diff < 3600) return `Active ${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `Active ${Math.floor(diff / 3600)} hours ago`;
        return `Active ${last.toLocaleDateString()}`;
    };

    /* ------------------------------
       Load chats
    ------------------------------ */

    const loadChats = async (showLoading = false) => {
        if (showLoading) setLoadingChats(true);

        const res = await fetch("http://localhost:5000/api/chat", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        setChats(prev =>
            data.map(chatFromServer => {
                const old = prev.find(c => c._id === chatFromServer._id);
                return {
                    ...chatFromServer,
                    lastMessage: old?.lastMessage ?? chatFromServer.lastMessage
                };
            })
        );


        localStorage.setItem("cachedChats", JSON.stringify(data));

        if (showLoading) setLoadingChats(false);
    };

    useEffect(() => {
        const cached = localStorage.getItem("cachedChats");
        if (cached) {
            setChats(JSON.parse(cached));
            setLoadingChats(false);
        }

        loadChats(!cached).then(() => setCacheReady(true));
    }, []);

    /* ------------------------------
       Load messages + chat info
    ------------------------------ */

    const loadMessages = async () => {
        const res = await fetch(`http://localhost:5000/api/messages/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMessages(data);
    };

    const loadChatInfo = async () => {
        const res = await fetch(`http://localhost:5000/api/chat/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const chat = await res.json();
        setCurrentChat(chat);
        setOtherUser(chat.users.find(u => u._id !== myId));
    };


    useEffect(() => {
        if (!chatId) return;

        loadMessages();
        loadChatInfo();

        // Mark messages as read when entering the chat
        fetch(`http://localhost:5000/api/messages/${chatId}/read`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        }).then(() => loadMessages());

        setAutoScroll(true);
    }, [chatId]);

    /* ------------------------------
       Socket listeners
    ------------------------------ */

    useEffect(() => {
        if (!window.socket) return;

        const handleNewMessage = (msg) => {
            setChats(prev =>
                prev.map(chat =>
                    chat._id === msg.chatId
                        ? {
                            ...chat,
                            lastMessage: msg.text || msg.replyTo?.text || chat.lastMessage || "",
                            lastSender: msg.sender?._id || msg.sender,
                            lastMessageAt: msg.createdAt,
                            lastMessageReadBy: []
                        }
                        : chat
                )
            );

            if (msg.chatId === chatId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });

                if (msg.sender !== myId && msg.sender?._id !== myId) {
                    fetch(`http://localhost:5000/api/messages/${chatId}/read`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
        };

        window.socket.on("new_message", handleNewMessage);

        return () => {
            window.socket.off("new_message", handleNewMessage);
        };
    }, []);

    useEffect(() => {
        if (!window.socket || !chatId) return;

        window.socket.emit("join_chat", chatId);

        const handleRead = (data) => {
            if (data.chatId === chatId) loadMessages();
        };

        const handleTyping = ({ userId }) => {
            if (userId === otherUser?._id) setIsTyping(true);
        };

        const handleStopTyping = ({ userId }) => {
            if (userId === otherUser?._id) setIsTyping(false);
        };

        const handleChatUpdated = (data) => {
            setChats(prev =>
                prev.map(chat =>
                    chat._id === data.chatId
                        ? {
                            ...chat,
                            ...data,
                            lastMessage: data.lastMessage ?? chat.lastMessage
                        }

                        : chat
                )
            );
        };

        window.socket.on("messages_read", handleRead);
        window.socket.on("typing", handleTyping);
        window.socket.on("stop_typing", handleStopTyping);
        window.socket.on("chat_updated", handleChatUpdated);

        return () => {
            window.socket.off("messages_read", handleRead);
            window.socket.off("typing", handleTyping);
            window.socket.off("stop_typing", handleStopTyping);
            window.socket.off("chat_updated", handleChatUpdated);
        };
    }, [chatId, otherUser]);

    /* ------------------------------
       Typing emitter
    ------------------------------ */

    useEffect(() => {
        if (!window.socket || !chatId) return;

        if (text.length > 0) {
            window.socket.emit("typing", { chatId, userId: myId });
        } else {
            window.socket.emit("stop_typing", { chatId, userId: myId });
        }
    }, [text]);

    /* ------------------------------
       Send message
    ------------------------------ */

    const sendMessage = async () => {
        if (!text.trim()) return;

        setAutoScroll(true);

        const res = await fetch("http://localhost:5000/api/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                chatId,
                text,
                replyTo: replyTo?._id || null
            })
        });

        const newMsg = await res.json();

        setText("");
        setReplyTo(null); // Clear reply after sending
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    /* ------------------------------
       Auto-scroll when messages change
    ------------------------------ */

    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [messages]);

    /* ------------------------------
       UI helpers
    ------------------------------ */

    const myMessages = messages.filter(
        m => m.sender === myId || m.sender?._id === myId
    );

    const lastMyMessageId = myMessages.at(-1)?._id;

    const lastMyReadMessageId = myMessages
        .filter(m => m.readBy?.includes(otherUser?._id))
        .at(-1)?._id;

    /* ------------------------------
       Realtime online/offline status
    ------------------------------ */

    useEffect(() => {
        if (!window.socket || !otherUser) return;

        const handleUserOnline = ({ userId }) => {
            if (userId === otherUser._id) {
                setOtherUser(prev => ({
                    ...prev,
                    lastSeen: new Date().toISOString()
                }));
            }
        };

        const handleUserOffline = ({ userId }) => {
            if (userId === otherUser._id) {
                setOtherUser(prev => ({
                    ...prev,
                    lastSeen: new Date().toISOString()
                }));
            }
        };

        window.socket.on("user_online", handleUserOnline);
        window.socket.on("user_offline", handleUserOffline);

        return () => {
            window.socket.off("user_online", handleUserOnline);
            window.socket.off("user_offline", handleUserOffline);
        };
    }, [otherUser]);

    /* ------------------------------
       Realtime online status for chat list
    ------------------------------ */

    useEffect(() => {
        if (!window.socket) return;

        const handleUserOnline = ({ userId }) => {
            setChats(prev =>
                prev.map(chat => {
                    const updatedUsers = chat.users.map(u =>
                        u._id === userId
                            ? { ...u, lastSeen: new Date().toISOString() }
                            : u
                    );
                    return { ...chat, users: updatedUsers };
                })
            );
        };

        const handleUserOffline = ({ userId }) => {
            setChats(prev =>
                prev.map(chat => {
                    const updatedUsers = chat.users.map(u =>
                        u._id === userId
                            ? { ...u, lastSeen: new Date().toISOString() }
                            : u
                    );
                    return { ...chat, users: updatedUsers };
                })
            );
        };

        window.socket.on("user_online", handleUserOnline);
        window.socket.on("user_offline", handleUserOffline);

        return () => {
            window.socket.off("user_online", handleUserOnline);
            window.socket.off("user_offline", handleUserOffline);
        };
    }, []);

    /* ------------------------------
       Close message menu on outside click
    ------------------------------ */

    useEffect(() => {
        const close = () => setMenuMessageId(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    /* ------------------------------
       Close timestamp when clicking outside
    ------------------------------ */

    useEffect(() => {
        const closeTime = (e) => {
            if (e.target.closest(".message")) return;
            setSelectedMessageId(null);
        };

        window.addEventListener("click", closeTime);
        return () => window.removeEventListener("click", closeTime);
    }, []);

    /* ------------------------------
       Preview formatter
    ------------------------------ */

    function formatPreview(text) {
        if (!text) return "";
        text = text.replace(/\n/g, " ");
        const limit = 16;
        return text.length > limit ? text.slice(0, limit) + "…" : text;
    }

    // Remove permanent reply marker when clicking outside messages
    useEffect(() => {
        const clearMarker = (e) => {
            if (!e.target.closest(".msg-row")) {
                setRepliedMessage(null);
            }
        };

        window.addEventListener("click", clearMarker);
        return () => window.removeEventListener("click", clearMarker);
    }, []);


    return (
        <div className="chat-layout">

            {/* SIDEBAR */}
            <div className="chat-sidebar">
                <div className="sidebar-title">Chats</div>

                <div className="chat-list">
                    {chats.map(chat => {
                        const other = chat.users.find(u => u._id !== myId);

                        return (
                            <div
                                key={chat._id}
                                className={`chat-item ${chat.lastSender !== myId &&
                                    !chat.lastMessageReadBy?.includes(myId)
                                    ? "unread-chat"
                                    : ""
                                    }`}
                                onClick={() => navigate(`/dashboard/chat/${chat._id}`)}
                            >
                                <div className="chat-avatar-wrapper">
                                    <div className={`chat-avatar ${isOnline(other.lastSeen) ? "online" : ""}`}>
                                        <img src={other.photo} />
                                    </div>

                                    {!isOnline(other.lastSeen) && getLastActiveShort(other.lastSeen) && (
                                        <span className="last-active-badge">
                                            {getLastActiveShort(other.lastSeen)}
                                        </span>
                                    )}
                                </div>

                                <div className="chat-info">
                                    <div className="chat-name">{other.name}</div>

                                    <div className="chat-preview">
                                        <span className="preview-text">
                                            {(chat.lastSender === myId ? "You: " : "") +
                                                formatPreview(chat.lastMessage || "Start a conversation")}
                                        </span>

                                        <div className="preview-right">
                                            <span className="chat-time">
                                                {chat.lastMessageAt ? formatChatTime(chat.lastMessageAt) : ""}
                                            </span>

                                            {/* Blue unread dot */}
                                            {chat.lastSender !== myId &&
                                                !chat.lastMessageReadBy?.includes(myId) && (
                                                    <div className="unread-dot"></div>
                                                )}

                                            {/* Read avatar */}
                                            {chat.lastSender === myId &&
                                                chat.lastMessageReadBy?.includes(other._id) && (
                                                    <img src={other.photo} className="read-avatar" />
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CHAT WINDOW */}
            {!chatId ? (
                <div className="empty-chat">
                    <h2>Select a chat to start messaging</h2>
                </div>
            ) : (
                <div className="chat-window">

                    {/* HEADER */}
                    {otherUser && (
                        <div className="chat-header">
                            <div className="user-info">
                                <div className={`user-avatar ${getStatus() === "Active now" ? "online" : ""}`}>
                                    <img src={otherUser.photo} />
                                </div>
                                <div className="user-text">
                                    <b>{otherUser.name}</b>
                                    <span className="status">{getStatus()}</span>
                                </div>
                            </div>

                            <div className="header-actions">
                                📞
                                <span>⋯</span>
                            </div>
                        </div>
                    )}

                    {/* MESSAGES */}
                    <div
                        className="chat-messages"
                        onScroll={(e) => {
                            const el = e.target;
                            const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                            setAutoScroll(isAtBottom);
                            setShowScrollDown(!isAtBottom);
                        }}
                    >

                        {messages.map((msg, index) => {
                            const msgDate = new Date(msg.createdAt).toDateString();
                            const prevDate =
                                index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;

                            const showDate = msgDate !== prevDate;

                            return (
                                <div key={msg._id}>
                                    {showDate && (
                                        <div className="date-separator">
                                            {formatDateLabel(msg.createdAt)}
                                        </div>
                                    )}

                                    <div
                                        id={`msg-${msg._id}`}
                                        className={`msg-row 
                                         ${msg.sender === myId || msg.sender?._id === myId ? "me" : ""}
                                         ${highlightedMessage === msg._id ? "reply-highlight" : ""}
                                        ${repliedMessage === msg._id
                                                ? (msg.sender === myId || msg.sender?._id === myId
                                                    ? "reply-marker-right"
                                                    : "reply-marker-left")
                                                : ""
                                            }
                                        `}
                                    >

                                        {(msg.sender !== myId && msg.sender?._id !== myId) && (
                                            <img src={otherUser?.photo} />
                                        )}

                                        <div
                                            className={`message ${msg.sender === myId || msg.sender?._id === myId ? "" : "other"
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMessageId(msg._id);
                                                if (!msg.replyTo) return;

                                                const target = document.getElementById(`msg-${msg.replyTo._id}`);

                                                if (target) {
                                                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    setHighlightedMessage(msg.replyTo._id);
                                                    setRepliedMessage(msg.replyTo._id);
                                                    setTimeout(() => setHighlightedMessage(null), 1000);
                                                }
                                            }}
                                        >
                                            {/* Message menu */}
                                            {!(msg.sender === myId || msg.sender?._id === myId) && (
                                                <div
                                                    className="msg-menu-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuMessageId(msg._id);
                                                    }}
                                                >
                                                    ⋮
                                                </div>
                                            )}

                                            {menuMessageId === msg._id && (
                                                <div className="msg-menu">
                                                    <div
                                                        onClick={() => {
                                                            setReplyTo(msg);
                                                            setMenuMessageId(null);
                                                        }}
                                                    >
                                                        Reply
                                                    </div>

                                                    <div
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(msg.text);
                                                            setMenuMessageId(null);
                                                        }}
                                                    >
                                                        Copy
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reply bubble */}
                                            {msg.replyTo && (
                                                <div
                                                    className="reply-bubble"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        const target = document.getElementById(`msg-${msg.replyTo._id}`);

                                                        if (target) {
                                                            target.scrollIntoView({ behavior: "smooth", block: "center" });

                                                            // highlight + marker will be added in final integration
                                                        }
                                                    }}
                                                >
                                                    <div className="reply-author">
                                                        {msg.replyTo.sender === myId ? "You" : otherUser?.name}
                                                    </div>

                                                    <div className="reply-snippet">
                                                        {msg.replyTo.text}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Message text */}
                                            {msg.text}

                                            {/* Timestamp */}
                                            {selectedMessageId === msg._id && (
                                                <div className="msg-time">
                                                    {formatChatTime(msg.createdAt)}
                                                </div>
                                            )}

                                            {/* Status for last message sent by me */}
                                            {(msg.sender === myId || msg.sender?._id === myId) &&
                                                msg._id === lastMyMessageId && (
                                                    <div className="msg-status">
                                                        {msg.readBy?.includes(otherUser?._id)
                                                            ? `Read ${formatChatTime(msg.readAt || msg.createdAt)}`
                                                            : "Delivered"}
                                                    </div>
                                                )}

                                            {/* Status for previously read messages */}
                                            {(msg.sender === myId || msg.sender?._id === myId) &&
                                                msg._id === lastMyReadMessageId &&
                                                msg._id !== lastMyMessageId && (
                                                    <div className="msg-status">
                                                        {`Read ${formatChatTime(msg.readAt || msg.createdAt)}`}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="typing-indicator">
                                <img src={otherUser?.photo} className="typing-avatar" />
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Scroll down button */}
                    {showScrollDown && (
                        <div
                            className="scroll-down-btn"
                            onClick={() => {
                                setAutoScroll(true);
                                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            ↓
                        </div>
                    )}

                    {/* Reply preview */}
                    {replyTo && (
                        <div className="reply-preview">
                            <div className="reply-preview-header">
                                Replying to {replyTo.sender === myId ? "yourself" : otherUser?.name}
                                <span className="reply-close" onClick={() => setReplyTo(null)}>✕</span>
                            </div>

                            <div className="reply-preview-text">
                                {replyTo.text}
                            </div>
                        </div>
                    )}

                    {/* Input bar */}
                    <div className="chat-input">
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>

                </div>
            )}

        </div>
    );
}
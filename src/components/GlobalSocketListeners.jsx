import { useEffect } from "react";
import { API_URL } from "../lib/config";

export default function GlobalSocketListeners({ setChats }) {

    // Load chats once when the app starts
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${API_URL}/api/chats`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setChats(data))
            .catch(err => console.error("Error loading chats:", err));
    }, []);

    // Listen for new messages
    useEffect(() => {
        if (!window.socket) return;

        const handleNewMessage = (msg) => {
            setChats(prev =>
                prev.map(chat =>
                    chat._id === msg.chatId
                        ? {
                            ...chat,
                            lastMessage: msg.text || "Message removed",
                            lastSender: msg.sender?._id || msg.sender,
                            lastMessageAt: msg.createdAt,
                            lastMessageReadBy: []
                        }
                        : chat
                )
            );
        };

        window.socket.on("new_message", handleNewMessage);

        return () => {
            window.socket.off("new_message", handleNewMessage);
        };
    }, []);

    // Listen for chat updates (read receipts, typing, etc.)
    useEffect(() => {
        if (!window.socket) return;

        const handleChatUpdated = (data) => {
            setChats(prev =>
                prev.map(chat =>
                    chat._id === data.chatId
                        ? { ...chat, ...data }
                        : chat
                )
            );
        };

        window.socket.on("chat_updated", handleChatUpdated);

        return () => {
            window.socket.off("chat_updated", handleChatUpdated);
        };
    }, []);

    // Listen for online/offline
    useEffect(() => {
        if (!window.socket) return;

        const updateUser = (userId) => {
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

        window.socket.on("user_online", ({ userId }) => updateUser(userId));
        window.socket.on("user_offline", ({ userId }) => updateUser(userId));

        return () => {
            window.socket.off("user_online");
            window.socket.off("user_offline");
        };
    }, []);

    // Listen for unsent messages
    useEffect(() => {
        if (!window.socket) return;

        const handleUnsent = (data) => {
            setChats(prev =>
                prev.map(chat =>
                    chat._id === data.chatId
                        ? {
                            ...chat,
                            lastMessage: data.lastMessage,
                            lastSender: data.lastSender,
                            lastMessageReadBy: data.lastMessageReadBy
                        }
                        : chat
                )
            );
        };

        window.socket.on("message_unsent", handleUnsent);

        return () => {
            window.socket.off("message_unsent", handleUnsent);
        };
    }, []);

    return null;
}
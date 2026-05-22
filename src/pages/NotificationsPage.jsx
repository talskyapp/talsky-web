import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Bell, Trash2 } from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/NotificationsPage.css";

dayjs.extend(relativeTime);

export default function NotificationsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState("all");

    const token = localStorage.getItem("token");

    const loadNotifications = async () => {
        if (!token) return;

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/api/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.msg || "Failed to load notifications");
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Load notifications error:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsReadSilently = async () => {
        if (!token) return;

        try {
            await fetch(`${API_URL}/api/notifications/read-all`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setNotifications((prev) =>
                prev.map((item) => ({
                    ...item,
                    read: true,
                    readAt: item.readAt || new Date().toISOString(),
                }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error("Mark all as read error:", error);
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadNotifications();
        };

        init();
    }, []);

    useEffect(() => {
        if (!loading && unreadCount > 0) {
            markAllAsReadSilently();
        }
    }, [loading]);

    useEffect(() => {
        if (!window.socket) return;

        const handleNewNotification = (notification) => {
            if (!notification?._id) return;

            setNotifications((prev) => {
                const existing = prev.find((item) => item._id === notification._id);
                const filtered = prev.filter((item) => item._id !== notification._id);

                if (!existing) {
                    setUnreadCount((count) => count + 1);
                } else if (existing.read && !notification.read) {
                    setUnreadCount((count) => count + 1);
                }

                return [notification, ...filtered];
            });
        };

        window.socket.on("new_notification", handleNewNotification);

        return () => {
            window.socket.off("new_notification", handleNewNotification);
        };
    }, []);

    const filteredNotifications = useMemo(() => {
        if (filter === "unread") {
            return notifications.filter((item) => !item.read);
        }

        return notifications;
    }, [notifications, filter]);

    const resolveImage = (item) => {
        const src = item?.image || item?.actor?.photo || "";
        if (!src) return "/default-avatar.png";
        return src.startsWith("http") ? src : `${API_URL}${src}`;
    };

    const getNotificationTitle = (item) => {
        if (item.type === "follow") {
            return t("notifications.items.follow.title");
        }

        if (item.type === "ideal_match") {
            return t(item.title);
        }

        if (item.type === "app_update") {
            return t("notifications.items.appUpdate.title");
        }

        if (item.type === "policy_update") {
            return t("notifications.items.policyUpdate.title");
        }

        if (item.type === "privacy_update") {
            return t("notifications.items.privacyUpdate.title");
        }

        return item.title || "";
    };

    const getNotificationBody = (item) => {
        const actorName =
            item?.actor?.name ||
            item?.actor?.username ||
            t("notifications.someone");

        if (item.type === "follow") {
            const body = t("notifications.items.follow.body");
            return typeof body === "function" ? body(actorName) : body;
        }

        if (item.type === "ideal_match") {
            const bodyTemplate = t(item.body);

            const params = {
                name: actorName,
                ...(item?.data?.bodyParams || {}),
            };

            return typeof bodyTemplate === "function"
                ? bodyTemplate(params)
                : bodyTemplate;
        }

        return item.body || "";
    };

    const markOneAsRead = async (notificationId) => {
        if (!token || !notificationId) return;

        try {
            const res = await fetch(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.msg || "Failed to mark notification as read");
            }

            setNotifications((prev) =>
                prev.map((item) =>
                    item._id === notificationId
                        ? { ...item, read: true, readAt: new Date().toISOString() }
                        : item
                )
            );

            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Mark one as read error:", error);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!token || !notificationId) return;

        try {
            const target = notifications.find((item) => item._id === notificationId);

            const res = await fetch(
                `${API_URL}/api/notifications/${notificationId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.msg || "Failed to delete notification");
            }

            setNotifications((prev) =>
                prev.filter((item) => item._id !== notificationId)
            );

            if (target && !target.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Delete notification error:", error);
        }
    };

    const handleNotificationClick = async (item) => {
        if (!item.read) {
            await markOneAsRead(item._id);
        }

        if (item.actionUrl) {
            navigate(item.actionUrl);
        }
    };

    return (
        <div className="notifications-page">
            <div className="notifications-page-header">
                <div className="notifications-page-title-wrap">
                    <div className="notifications-page-kicker">
                        {t("notifications.page.kicker")}
                    </div>

                    <h1>{t("notifications.page.title")}</h1>
                    <p>{t("notifications.page.subtitle")}</p>
                </div>

                <div className="notifications-page-actions">
                    <button
                        type="button"
                        className={`notifications-filter-btn ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        {t("notifications.page.filters.all")}
                    </button>

                    <button
                        type="button"
                        className={`notifications-filter-btn ${filter === "unread" ? "active" : ""}`}
                        onClick={() => setFilter("unread")}
                    >
                        {t("notifications.page.filters.unread")}
                    </button>
                </div>
            </div>

            <div className="notifications-page-card">
                {loading ? (
                    <div className="notifications-page-empty">
                        <Bell size={28} />
                        <p>{t("notifications.loading")}</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="notifications-page-empty">
                        <Bell size={28} />
                        <h3>{t("notifications.page.emptyTitle")}</h3>
                        <p>
                            {filter === "unread"
                                ? t("notifications.page.emptyUnread")
                                : t("notifications.empty")}
                        </p>
                    </div>
                ) : (
                    <div className="notifications-page-list">
                        {filteredNotifications.map((item) => (
                            <div
                                key={item._id}
                                className={`notifications-page-item ${item.read ? "" : "unread"}`}
                            >
                                <button
                                    type="button"
                                    className="notifications-page-item-main"
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    <div className="notifications-page-avatar">
                                        <img
                                            src={resolveImage(item)}
                                            alt={
                                                item?.actor?.name ||
                                                item?.actor?.username ||
                                                "User"
                                            }
                                        />
                                    </div>

                                    <div className="notifications-page-content">
                                        <div className="notifications-page-topline">
                                            <h3 className="notifications-page-item-title">
                                                {getNotificationTitle(item)}
                                            </h3>

                                            <span className="notifications-page-time">
                                                {dayjs(item.createdAt).fromNow()}
                                            </span>
                                        </div>

                                        <div className="notifications-page-item-body">
                                            {getNotificationBody(item)}
                                        </div>
                                    </div>

                                    {!item.read && (
                                        <span className="notifications-page-unread-dot" />
                                    )}
                                </button>

                                <div className="notifications-page-item-side">
                                    <button
                                        type="button"
                                        className="notifications-side-btn danger"
                                        onClick={() => deleteNotification(item._id)}
                                        title={t("notifications.page.actions.delete")}
                                        aria-label={t("notifications.page.actions.delete")}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
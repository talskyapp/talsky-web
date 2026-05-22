import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";

dayjs.extend(relativeTime);

export default function NotificationBell() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const panelRef = useRef(null);

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

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleToggle = async () => {
        const next = !open;
        setOpen(next);

        if (next) {
            await loadNotifications();
        }
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

    const markAllAsRead = async () => {
        if (!token || unreadCount === 0) return;

        try {
            const res = await fetch(`${API_URL}/api/notifications/read-all`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.msg || "Failed to mark all as read");
            }

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

    const resolveImage = (item) => {
        const src = item?.image || item?.actor?.photo || "";
        if (!src) return "/default-avatar.png";
        return src.startsWith("http") ? src : `${API_URL}${src}`;
    };

    const handleNotificationClick = async (item) => {
        if (!item.read) {
            await markOneAsRead(item._id);
        }

        setOpen(false);

        if (item.actionUrl) {
            navigate(item.actionUrl);
        }
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


    return (
        <div className="notification-bell-wrap" ref={panelRef}>
            <button
                type="button"
                className={`header-icon-btn notification-bell-btn ${open ? "active" : ""}`}
                onClick={handleToggle}
                aria-label={t("notifications.openPanel")}
                title={t("notifications.openPanel")}
            >
                <Bell size={18} />

                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <div>
                            <h3>{t("notifications.title")}</h3>
                            <p>{t("notifications.subtitle")}</p>
                        </div>

                        <button
                            type="button"
                            className="notification-mark-all-btn"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <CheckCheck size={16} />
                            <span>{t("notifications.markAllRead")}</span>
                        </button>
                    </div>

                    <div className="notification-panel-body">
                        {loading ? (
                            <div className="notification-empty">
                                {t("notifications.loading")}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                {t("notifications.empty")}
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <button
                                    key={item._id}
                                    type="button"
                                    className={`notification-item ${item.read ? "" : "unread"}`}
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    <div className="notification-item-avatar">
                                        <img
                                            src={resolveImage(item)}
                                            alt={item?.actor?.name || item?.actor?.username || "User"}
                                        />
                                    </div>

                                    <div className="notification-item-content">
                                        <div className="notification-item-title-row">
                                            <span className="notification-item-title">
                                                {getNotificationTitle(item)}
                                            </span>

                                            <span className="notification-item-time">
                                                {dayjs(item.createdAt).fromNow()}
                                            </span>
                                        </div>

                                        <div className="notification-item-body">
                                            {getNotificationBody(item)}
                                        </div>
                                    </div>

                                    {!item.read && (
                                        <span className="notification-unread-dot" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="notification-panel-footer">
                        <Link
                            to="/dashboard/notifications"
                            className="notification-view-all-link"
                            onClick={() => setOpen(false)}
                        >
                            {t("notifications.viewAll")}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
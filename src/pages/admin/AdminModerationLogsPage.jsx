import { useEffect, useState } from "react";
import axios from "axios";
import {
    Activity,
    Clock3,
    RefreshCcw,
    ShieldCheck,
} from "lucide-react";
import { API_URL } from "../../lib/config";
import "../../styles/AdminModerationLogsPage.css";

function getImageUrl(path) {
    if (!path) return "/default-avatar.png";
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
}

function formatAction(action) {
    return String(action || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminModerationLogsPage() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadLogs();
    }, [page]);

    async function loadLogs() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/moderation-logs`, {
                params: {
                    page,
                    limit: 25,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setLogs(res.data.logs || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error(err);
            setError("Could not load moderation logs.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="admin-logs-page">
            <div className="admin-logs-header">
                <div>
                    <p className="admin-kicker">TalSky Trust & Safety</p>
                    <h1>Moderation Logs</h1>
                    <p>Audit trail for admin actions, verification decisions, and account moderation.</p>
                </div>

                <button className="admin-refresh-btn" onClick={loadLogs}>
                    <RefreshCcw size={16} />
                    Refresh
                </button>
            </div>

            <div className="admin-logs-summary">
                <div>
                    <Activity size={18} />
                    <span>{pagination?.total || 0} actions logged</span>
                </div>

                <div>
                    <ShieldCheck size={18} />
                    <span>Audit trail enabled</span>
                </div>
            </div>

            {loading && (
                <div className="admin-loading-bar">
                    Loading moderation logs...
                </div>
            )}

            {error && (
                <div className="admin-error-bar">
                    {error}
                </div>
            )}

            <div className="admin-logs-list">
                {!loading && logs.length === 0 ? (
                    <div className="admin-empty-log">
                        <Clock3 size={34} />
                        <h3>No logs yet</h3>
                        <p>Admin actions will appear here once moderators start reviewing users.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div className="admin-log-card" key={log._id}>
                            <div className="admin-log-icon">
                                <ShieldCheck size={18} />
                            </div>

                            <div className="admin-log-main">
                                <div className="admin-log-top">
                                    <h2>{formatAction(log.action)}</h2>

                                    <span>
                                        {log.createdAt
                                            ? new Date(log.createdAt).toLocaleString()
                                            : "Unknown"}
                                    </span>
                                </div>

                                <div className="admin-log-people">
                                    <div className="admin-log-person">
                                        <span>Admin</span>

                                        <div>
                                            <img
                                                src={getImageUrl(log.admin?.photo)}
                                                alt={log.admin?.name || "Admin"}
                                            />

                                            <p>
                                                <strong>{log.admin?.name || "Admin"}</strong>
                                                <small>@{log.admin?.username || "admin"}</small>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="admin-log-person">
                                        <span>Target user</span>

                                        <div>
                                            <img
                                                src={getImageUrl(log.targetUser?.photo)}
                                                alt={log.targetUser?.name || "User"}
                                            />

                                            <p>
                                                <strong>{log.targetUser?.name || "Unknown"}</strong>
                                                <small>@{log.targetUser?.username || "username"}</small>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {log.reason && (
                                    <div className="admin-log-reason">
                                        <strong>Reason</strong>
                                        <p>{log.reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {pagination && (
                <div className="admin-pagination">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                        Previous
                    </button>

                    <span>
                        Page {pagination.page} of {pagination.totalPages || 1}
                    </span>

                    <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPage((prev) => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
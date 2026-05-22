import { useEffect, useState } from "react";
import axios from "axios";
import {
    BadgeCheck,
    CreditCard,
    Search,
    Shield,
    Users,
} from "lucide-react";
import { API_URL } from "../../lib/config";
import "../../styles/AdminUsersPage.css";

function getImageUrl(path) {
    if (!path) return "/default-avatar.png";
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [showUserModal, setShowUserModal] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setPage(1);
        }, 600);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadUsers();
    }, [page, filter, debouncedQuery]);

    async function loadUsers() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/users`, {
                params: {
                    page,
                    limit: 25,
                    filter,
                    search: debouncedQuery,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUsers(res.data.users || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error(err);
            setError("Could not load users.");
        } finally {
            setLoading(false);
        }
    }

    async function openUserDetails(userId) {
        try {
            setUserDetailsLoading(true);
            setShowUserModal(true);

            const token = localStorage.getItem("token");

            const res = await axios.get(
                `${API_URL}/api/admin/users/${userId}/details`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUserDetails(res.data);
        } catch (err) {
            console.error(err);
            alert("Could not load user details.");
            setShowUserModal(false);
        } finally {
            setUserDetailsLoading(false);
        }
    }

    return (
        <div className="admin-users-page">
            <div className="admin-users-header">
                <div>
                    <p className="admin-kicker">TalSky Admin</p>
                    <h1>Users Management</h1>
                    <p>Search, review, and manage TalSky accounts.</p>
                </div>

                <div className="admin-users-count">
                    <Users size={18} />
                    <span>{pagination?.total || users.length} users</span>
                </div>
            </div>

            <div className="admin-users-toolbar">
                <div className="admin-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search username, email..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="admin-filter-tabs">
                    {["all", "pro", "free", "verified", "suspended"].map((item) => (
                        <button
                            key={item}
                            className={filter === item ? "active" : ""}
                            onClick={() => {
                                setFilter(item);
                                setPage(1);
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-users-table-wrapper">
                {loading && (
                    <div className="admin-loading-bar">
                        Searching users...
                    </div>
                )}

                {error && (
                    <div className="admin-error-bar">
                        {error}
                    </div>
                )}
                <table className="admin-users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Country</th>
                            <th>Plan</th>
                            <th>Verification</th>
                            <th>Last Seen</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => {
                            const plan = user.subscription?.plan || "free";
                            const verification = user.verification?.status || "none";

                            return (
                                <tr key={user._id}>
                                    <td>
                                        <div className="admin-user-cell">
                                            <img
                                                src={getImageUrl(user.photo)}
                                                alt={user.name || user.username || "User"}
                                            />

                                            <div>
                                                <strong>{user.name || "No name"}</strong>
                                                <span>@{user.username || "username"}</span>
                                                <p>{user.email || "No email"}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{user.country || "—"}</td>

                                    <td>
                                        <span className={`admin-plan-badge ${plan}`}>
                                            <CreditCard size={13} />
                                            {plan}
                                        </span>
                                    </td>

                                    <td>
                                        <span className={`admin-verification-badge ${verification}`}>
                                            <BadgeCheck size={13} />
                                            {verification}
                                        </span>
                                    </td>

                                    <td>
                                        {user.lastSeen
                                            ? new Date(user.lastSeen).toLocaleString()
                                            : "—"}
                                    </td>

                                    <td>
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : "—"}
                                    </td>

                                    <td>
                                        <div className="admin-user-actions">
                                            <button
                                                title="View user details"
                                                onClick={() => openUserDetails(user._id)}
                                            >
                                                <Shield size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {pagination && (
                    <div className="admin-pagination">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </button>

                        <span>
                            Page {pagination.page} of {pagination.totalPages}
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
            {showUserModal && (
                <AdminUserDetailsModal
                    data={userDetails}
                    loading={userDetailsLoading}
                    onClose={() => {
                        setShowUserModal(false);
                        setUserDetails(null);
                    }}
                />
            )}
        </div>
    );
}

function AdminUserDetailsModal({ data, loading, onClose }) {
    const user = data?.user;

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <div className="admin-user-modal" onClick={(e) => e.stopPropagation()}>
                <button className="admin-modal-close" onClick={onClose}>
                    ×
                </button>

                {loading ? (
                    <div className="admin-loading-bar">Loading user details...</div>
                ) : (
                    <>
                        <h2>User details</h2>

                        <div className="admin-modal-user">
                            <img src={getImageUrl(user?.photo)} alt="" />

                            <div>
                                <h3>{user?.name || "Unknown"}</h3>
                                <p>@{user?.username || "username"}</p>
                                <span>{user?.email || "No email"}</span>
                            </div>
                        </div>

                        <div className="admin-modal-grid">
                            <Info label="Status" value={user?.accountStatus || "active"} />
                            <Info label="Country" value={user?.country || "—"} />
                            <Info label="City" value={user?.location?.city || "—"} />
                            <Info label="Gender" value={user?.gender || "—"} />
                            <Info label="Birthday" value={user?.birthday || "—"} />
                            <Info label="Native language" value={user?.nativeLanguage || "—"} />
                            <Info label="Learning" value={(user?.languageToLearn || []).join(", ") || "—"} />
                            <Info label="Fluent" value={(user?.fluentLanguages || []).join(", ") || "—"} />
                            <Info label="Interests" value={(user?.interests || []).join(", ") || "—"} />
                            <Info label="Verification" value={user?.verification?.status || "none"} />
                            <Info label="Plan" value={`${user?.subscription?.plan || "free"} / ${user?.subscription?.status || "inactive"}`} />
                            <Info label="Reports received" value={data?.stats?.reportsReceivedCount ?? 0} />
                            <Info label="Reports sent" value={data?.stats?.reportsSentCount ?? 0} />
                            <Info label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"} />
                            <Info label="Last seen" value={user?.lastSeen ? new Date(user.lastSeen).toLocaleString() : "—"} />
                        </div>

                        <div className="admin-modal-section">
                            <strong>Bio</strong>
                            <p>{user?.bio || "—"}</p>
                        </div>

                        <div className="admin-modal-section">
                            <strong>Recent reports received</strong>

                            {data?.reportsReceived?.length ? (
                                data.reportsReceived.map((report) => (
                                    <div className="admin-mini-report" key={report._id}>
                                        <b>{report.reason}</b>
                                        <span>{report.status || "pending"}</span>
                                        <p>{report.details || "No details"}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No reports received.</p>
                            )}
                        </div>

                        <div className="admin-modal-section">
                            <strong>Moderation logs</strong>

                            {data?.moderationLogs?.length ? (
                                data.moderationLogs.map((log) => (
                                    <div className="admin-mini-report" key={log._id}>
                                        <b>{log.action}</b>
                                        <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</span>
                                        <p>{log.reason || "No reason"}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No moderation logs.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <strong>{label}</strong>
            <span>{String(value)}</span>
        </div>
    );
}
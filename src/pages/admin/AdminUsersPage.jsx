import { useEffect, useState } from "react";
import axios from "axios";
import {
    BadgeCheck,
    ChevronDown,
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
                    onChanged={loadUsers}
                    onClose={() => {
                        setShowUserModal(false);
                        setUserDetails(null);
                    }}
                />
            )}
        </div>
    );
}

function AdminUserDetailsModal({
    data,
    loading,
    onClose,
    onChanged,
}) {
    const originalUser = data?.user;

    const [user, setUser] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [savingAction, setSavingAction] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [showAdminControls, setShowAdminControls] = useState(false);

    useEffect(() => {
        if (!originalUser) return;

        setUser(originalUser);
        setEmail(originalUser.email || "");
    }, [originalUser]);

    const token = localStorage.getItem("token");

    const requestConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const startAction = (action) => {
        setSavingAction(action);
        setActionError("");
        setActionSuccess("");
    };

    const finishAction = async (message) => {
        setActionSuccess(message);
        await onChanged?.();
    };

    const getErrorMessage = (error, fallback) =>
        error.response?.data?.message ||
        error.response?.data?.msg ||
        fallback;

    const handleEmailChange = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setActionError("Enter an email address.");
            return;
        }

        if (normalizedEmail === user?.email?.toLowerCase()) {
            setActionError("Enter a different email address.");
            return;
        }

        try {
            startAction("email");

            const res = await axios.patch(
                `${API_URL}/api/admin/users/${user._id}/email`,
                {
                    email: normalizedEmail,
                },
                requestConfig
            );

            setUser((previous) => ({
                ...previous,
                email: res.data.user.email,
                emailVerified: res.data.user.emailVerified,
            }));

            await finishAction(
                res.data.message || "Email updated successfully."
            );
        } catch (error) {
            setActionError(
                getErrorMessage(error, "Could not update the email.")
            );
        } finally {
            setSavingAction("");
        }
    };

    const handlePasswordChange = async () => {
        if (password.length < 8) {
            setActionError(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setActionError("Passwords do not match.");
            return;
        }

        try {
            startAction("password");

            const res = await axios.patch(
                `${API_URL}/api/admin/users/${user._id}/password`,
                {
                    password,
                },
                requestConfig
            );

            setPassword("");
            setConfirmPassword("");

            await finishAction(
                res.data.message || "Password updated successfully."
            );
        } catch (error) {
            setActionError(
                getErrorMessage(error, "Could not update the password.")
            );
        } finally {
            setSavingAction("");
        }
    };

    const handleProChange = async () => {
        const currentlyPro =
            user?.subscription?.plan === "pro" &&
            ["active", "trialing", "past_due"].includes(
                user?.subscription?.status
            );

        try {
            startAction("subscription");

            const res = await axios.patch(
                `${API_URL}/api/admin/users/${user._id}/subscription`,
                {
                    enabled: !currentlyPro,
                },
                requestConfig
            );

            setUser((previous) => ({
                ...previous,
                subscription: res.data.subscription,
            }));

            await finishAction(
                res.data.message ||
                "Subscription updated successfully."
            );
        } catch (error) {
            setActionError(
                getErrorMessage(
                    error,
                    "Could not update the subscription."
                )
            );
        } finally {
            setSavingAction("");
        }
    };

    const handleTesterChange = async () => {
        const currentlyTester =
            user?.testerAccess?.enabled === true &&
            user?.testerAccess?.aiTutor === true;

        try {
            startAction("tester");

            const res = await axios.patch(
                `${API_URL}/api/admin/users/${user._id}/tester-access`,
                {
                    enabled: !currentlyTester,
                },
                requestConfig
            );

            setUser((previous) => ({
                ...previous,
                testerAccess: res.data.testerAccess,
            }));

            await finishAction(
                res.data.message ||
                "Tester access updated successfully."
            );
        } catch (error) {
            setActionError(
                getErrorMessage(
                    error,
                    "Could not update tester access."
                )
            );
        } finally {
            setSavingAction("");
        }
    };

    const isPro =
        user?.subscription?.plan === "pro" &&
        ["active", "trialing", "past_due"].includes(
            user?.subscription?.status
        );

    const isTester =
        user?.testerAccess?.enabled === true &&
        user?.testerAccess?.aiTutor === true;

    const actionInProgress = Boolean(savingAction);

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <div
                className="admin-user-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    className="admin-modal-close"
                    onClick={onClose}
                >
                    ×
                </button>

                {loading || !user ? (
                    <div className="admin-loading-bar">
                        Loading user details...
                    </div>
                ) : (
                    <>
                        <h2>User details</h2>

                        <div className="admin-modal-user">
                            <img
                                src={getImageUrl(user.photo)}
                                alt={user.name || "User"}
                            />

                            <div>
                                <h3>{user.name || "Unknown"}</h3>
                                <p>@{user.username || "username"}</p>
                                <span>{user.email || "No email"}</span>
                            </div>
                        </div>

                        <div className="admin-modal-grid">
                            <Info
                                label="Status"
                                value={user.accountStatus || "active"}
                            />

                            <Info
                                label="Country"
                                value={user.country || "—"}
                            />

                            <Info
                                label="City"
                                value={user.location?.city || "—"}
                            />

                            <Info
                                label="Gender"
                                value={user.gender || "—"}
                            />

                            <Info
                                label="Birthday"
                                value={user.birthday || "—"}
                            />

                            <Info
                                label="Native language"
                                value={user.nativeLanguage || "—"}
                            />

                            <Info
                                label="Learning"
                                value={
                                    (user.languageToLearn || []).join(", ") ||
                                    "—"
                                }
                            />

                            <Info
                                label="Fluent"
                                value={
                                    (user.fluentLanguages || []).join(", ") ||
                                    "—"
                                }
                            />

                            <Info
                                label="Verification"
                                value={
                                    user.verification?.status || "none"
                                }
                            />

                            <Info
                                label="Plan"
                                value={`${user.subscription?.plan || "free"} / ${user.subscription?.status || "inactive"
                                    }`}
                            />

                            <Info
                                label="AI tester"
                                value={isTester ? "Enabled" : "Disabled"}
                            />

                            <Info
                                label="Reports received"
                                value={
                                    data?.stats?.reportsReceivedCount ?? 0
                                }
                            />
                        </div>

                        <section className="admin-account-management">
                            <button
                                type="button"
                                className="admin-management-toggle"
                                onClick={() =>
                                    setShowAdminControls((previous) => !previous)
                                }
                                aria-expanded={showAdminControls}
                            >
                                <div>
                                    <p>ADMIN CONTROLS</p>
                                    <h3>Account management</h3>
                                    <span>
                                        Email, password, Pro and tester access.
                                    </span>
                                </div>

                                <ChevronDown
                                    size={22}
                                    className={showAdminControls ? "open" : ""}
                                />
                            </button>
                            {showAdminControls && (
                                <div className="admin-management-content">

                                    {actionError && (
                                        <div className="admin-action-message error">
                                            {actionError}
                                        </div>
                                    )}

                                    {actionSuccess && (
                                        <div className="admin-action-message success">
                                            {actionSuccess}
                                        </div>
                                    )}


                                    <div className="admin-management-block">
                                        <div>
                                            <strong>Email address</strong>
                                            <span>
                                                Changing it will require email verification again.
                                            </span>
                                        </div>

                                        <div className="admin-management-form">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) =>
                                                    setEmail(event.target.value)
                                                }
                                                disabled={actionInProgress}
                                            />

                                            <button
                                                type="button"
                                                onClick={handleEmailChange}
                                                disabled={actionInProgress}
                                            >
                                                {savingAction === "email"
                                                    ? "Saving..."
                                                    : "Change email"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="admin-management-block">
                                        <div>
                                            <strong>Reset password</strong>
                                            <span>
                                                Available only for accounts using email and password.
                                            </span>
                                        </div>

                                        <div className="admin-password-fields">
                                            <input
                                                type="password"
                                                placeholder="New password"
                                                value={password}
                                                onChange={(event) =>
                                                    setPassword(event.target.value)
                                                }
                                                disabled={actionInProgress}
                                            />

                                            <input
                                                type="password"
                                                placeholder="Confirm password"
                                                value={confirmPassword}
                                                onChange={(event) =>
                                                    setConfirmPassword(
                                                        event.target.value
                                                    )
                                                }
                                                disabled={actionInProgress}
                                            />

                                            <button
                                                type="button"
                                                onClick={handlePasswordChange}
                                                disabled={actionInProgress}
                                            >
                                                {savingAction === "password"
                                                    ? "Saving..."
                                                    : "Set new password"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="admin-management-block horizontal">
                                        <div>
                                            <strong>TalSky Pro</strong>
                                            <span>
                                                Current status:{" "}
                                                {isPro ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className={
                                                isPro
                                                    ? "admin-control-danger"
                                                    : "admin-control-primary"
                                            }
                                            onClick={handleProChange}
                                            disabled={actionInProgress}
                                        >
                                            {savingAction === "subscription"
                                                ? "Updating..."
                                                : isPro
                                                    ? "Remove Pro"
                                                    : "Grant Pro"}
                                        </button>
                                    </div>

                                    <div className="admin-management-block horizontal">
                                        <div>
                                            <strong>TalSky AI tester</strong>
                                            <span>
                                                Allow access to private AI Tutor testing.
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className={
                                                isTester
                                                    ? "admin-control-danger"
                                                    : "admin-control-primary"
                                            }
                                            onClick={handleTesterChange}
                                            disabled={actionInProgress}
                                        >
                                            {savingAction === "tester"
                                                ? "Updating..."
                                                : isTester
                                                    ? "Remove tester"
                                                    : "Make tester"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <div className="admin-modal-section">
                            <h3>Reports received</h3>

                            {!data?.reportsReceived?.length ? (
                                <p>No reports received.</p>
                            ) : (
                                data.reportsReceived.map((report) => (
                                    <div
                                        className="admin-report-item"
                                        key={report._id}
                                    >
                                        <strong>
                                            {report.reason || "Report"}
                                        </strong>
                                        <p>
                                            {report.details || "No details"}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="admin-modal-section">
                            <h3>Moderation history</h3>

                            {!data?.moderationLogs?.length ? (
                                <p>No moderation history.</p>
                            ) : (
                                data.moderationLogs.map((log) => (
                                    <div
                                        className="admin-log-item"
                                        key={log._id}
                                    >
                                        <strong>{log.action}</strong>
                                        <p>{log.reason || "No reason"}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div >
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
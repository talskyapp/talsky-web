import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Clock3,
    RefreshCcw,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { API_URL } from "../../lib/config";
import "../../styles/AdminVerificationsPage.css";

function getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
}

const tabs = [
    { key: "pending", label: "Pending" },
    { key: "verified", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "revoked", label: "Revoked" },
];

export default function AdminVerificationsPage() {
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("pending");
    const [expandedUserId, setExpandedUserId] = useState("");
    const [preview, setPreview] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        loadVerifications();
    }, [status, page]);

    async function loadVerifications() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/verifications`, {
                params: {
                    status,
                    page,
                    limit: 10,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUsers(res.data.users || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error(err);
            setError("Could not load verification records.");
        } finally {
            setLoading(false);
        }
    }

    function changeStatus(nextStatus) {
        setStatus(nextStatus);
        setPage(1);
        setExpandedUserId("");
    }

    async function approveUser(userId) {
        if (!window.confirm("Approve this verification? Uploaded photos will be deleted.")) return;

        try {
            setActionLoading(userId);

            const token = localStorage.getItem("token");

            await axios.patch(
                `${API_URL}/api/admin/verifications/${userId}/approve`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers((prev) => prev.filter((user) => user._id !== userId));
        } catch (err) {
            console.error(err);
            alert("Could not approve verification.");
        } finally {
            setActionLoading("");
        }
    }

    async function rejectUser(userId) {
        const reason = window.prompt(
            "Reason for rejection:",
            "Photos are unclear. Please try again."
        );

        if (reason === null) return;

        try {
            setActionLoading(userId);

            const token = localStorage.getItem("token");

            await axios.patch(
                `${API_URL}/api/admin/verifications/${userId}/reject`,
                { reason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers((prev) => prev.filter((user) => user._id !== userId));
        } catch (err) {
            console.error(err);
            alert("Could not reject verification.");
        } finally {
            setActionLoading("");
        }
    }

    return (
        <div className="admin-verifications-page">
            <div className="admin-verifications-header">
                <div>
                    <p className="admin-kicker">TalSky Trust Center</p>
                    <h1>Verifications</h1>
                    <p>
                        Review pending identity checks and monitor approved users.
                    </p>
                </div>

                <button onClick={loadVerifications} className="admin-refresh-btn">
                    <RefreshCcw size={16} />
                    Refresh
                </button>
            </div>

            <div className="admin-verification-toolbar">
                <div className="admin-filter-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={status === tab.key ? "active" : ""}
                            onClick={() => changeStatus(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="admin-verification-count">
                    <BadgeCheck size={17} />
                    <span>{pagination?.total || 0} records</span>
                </div>
            </div>

            {loading && (
                <div className="admin-loading-bar">
                    Loading verifications...
                </div>
            )}

            {error && (
                <div className="admin-error-bar">
                    {error}
                </div>
            )}

            <div className="admin-verification-table-card">
                <table className="admin-verification-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th>Reviewed</th>
                            <th>Documents</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {!loading && users.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="admin-empty-row">
                                        No {status} verification records.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => {
                                const isExpanded = expandedUserId === user._id;
                                const documentUrl = getImageUrl(user.verification?.documentPhoto);
                                const selfieUrl = getImageUrl(user.verification?.selfiePhoto);

                                return (
                                    <React.Fragment key={user._id}>
                                        <tr key={user._id}>
                                            <td>
                                                <div className="admin-verification-user">
                                                    <img
                                                        src={getImageUrl(user.photo) || "/default-avatar.png"}
                                                        alt={user.name || user.username || "User"}
                                                    />

                                                    <div>
                                                        <strong>{user.name || "No name"}</strong>
                                                        <span>@{user.username || "username"}</span>
                                                        <p>{user.email || "No email"}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`admin-status-pill ${status}`}>
                                                    {status === "pending" ? (
                                                        <Clock3 size={14} />
                                                    ) : (
                                                        <BadgeCheck size={14} />
                                                    )}
                                                    {status}
                                                </span>
                                            </td>

                                            <td>
                                                {user.verification?.submittedAt
                                                    ? new Date(user.verification.submittedAt).toLocaleString()
                                                    : "—"}
                                            </td>

                                            <td>
                                                {user.verification?.reviewedAt
                                                    ? new Date(user.verification.reviewedAt).toLocaleString()
                                                    : "—"}
                                            </td>

                                            <td>
                                                <button
                                                    className="admin-expand-btn"
                                                    onClick={() =>
                                                        setExpandedUserId(isExpanded ? "" : user._id)
                                                    }
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    {isExpanded ? "Hide" : "View"}
                                                </button>
                                            </td>

                                            <td>
                                                {status === "pending" ? (
                                                    <div className="admin-row-actions">
                                                        <button
                                                            className="approve"
                                                            disabled={actionLoading === user._id}
                                                            onClick={() => approveUser(user._id)}
                                                        >
                                                            <ShieldCheck size={15} />
                                                            Approve
                                                        </button>

                                                        <button
                                                            className="reject"
                                                            disabled={actionLoading === user._id}
                                                            onClick={() => rejectUser(user._id)}
                                                        >
                                                            <XCircle size={15} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="admin-muted-text">Reviewed</span>
                                                )}
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="admin-documents-row">
                                                <td colSpan="6">
                                                    <div className="admin-documents-panel">
                                                        <div className="admin-document-box">
                                                            <div className="admin-document-title">
                                                                Government ID
                                                            </div>

                                                            {documentUrl ? (
                                                                <button
                                                                    onClick={() =>
                                                                        setPreview({
                                                                            title: "Government ID",
                                                                            url: documentUrl,
                                                                        })
                                                                    }
                                                                >
                                                                    <img src={documentUrl} alt="Document" />
                                                                </button>
                                                            ) : (
                                                                <div className="admin-document-missing">
                                                                    Deleted / Missing
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="admin-document-box">
                                                            <div className="admin-document-title">
                                                                Selfie
                                                            </div>

                                                            {selfieUrl ? (
                                                                <button
                                                                    onClick={() =>
                                                                        setPreview({
                                                                            title: "Selfie",
                                                                            url: selfieUrl,
                                                                        })
                                                                    }
                                                                >
                                                                    <img src={selfieUrl} alt="Selfie" />
                                                                </button>
                                                            ) : (
                                                                <div className="admin-document-missing">
                                                                    Deleted / Missing
                                                                </div>
                                                            )}
                                                        </div>

                                                        {user.verification?.rejectionReason && (
                                                            <div className="admin-verification-note">
                                                                <strong>Reason</strong>
                                                                <p>{user.verification.rejectionReason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
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

            {preview && (
                <div className="admin-preview-overlay" onClick={() => setPreview(null)}>
                    <div className="admin-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-preview-header">
                            <h3>{preview.title}</h3>
                            <button onClick={() => setPreview(null)}>×</button>
                        </div>

                        <img src={preview.url} alt={preview.title} />
                    </div>
                </div>
            )}
        </div>
    );
}
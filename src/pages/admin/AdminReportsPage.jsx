import { useEffect, useState } from "react";
import axios from "axios";
import {
    AlertTriangle,
    CheckCircle2,
    Flag,
    RefreshCcw,
    ShieldAlert,
    User,
    UserX,
    XCircle,
} from "lucide-react";
import { API_URL } from "../../lib/config";
import "../../styles/AdminReportsPage.css";

function getImageUrl(path) {
    if (!path) return "/default-avatar.png";
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        loadReports();
    }, [page]);

    async function loadReports() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/reports`, {
                params: { page, limit: 20 },
                headers: { Authorization: `Bearer ${token}` },
            });

            setReports(res.data.reports || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error(err);
            setError("Could not load reports.");
        } finally {
            setLoading(false);
        }
    }

    async function updateReport(reportId, action, payload = {}) {
        try {
            setActionLoading(reportId);

            const token = localStorage.getItem("token");

            await axios.patch(
                `${API_URL}/api/admin/reports/${reportId}/${action}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            await loadReports();
        } catch (err) {
            console.error(err);
            alert("Could not update report.");
        } finally {
            setActionLoading("");
        }
    }

    async function openUserDetails(userId, report) {
        try {
            setSelectedReport(report);
            setUserDetailsLoading(true);
            setShowUserModal(true);

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/users/${userId}/details`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUserDetails(res.data);
        } catch (err) {
            console.error(err);
            alert("Could not load user details.");
            setShowUserModal(false);
        } finally {
            setUserDetailsLoading(false);
        }
    }

    function markReviewed(reportId) {
        const adminNote = window.prompt(
            "Admin note:",
            "Reviewed. No further action needed."
        );

        if (adminNote === null) return;

        updateReport(reportId, "review", { adminNote });
    }

    function dismissReport(reportId) {
        const adminNote = window.prompt(
            "Reason for dismissing:",
            "Report dismissed after review."
        );

        if (adminNote === null) return;

        updateReport(reportId, "dismiss", { adminNote });
    }

    function suspendFromReport(report) {
        const confirmed = window.confirm(
            `Suspend @${report.reportedUser?.username || "this user"} and mark this report as action taken?`
        );

        if (!confirmed) return;

        const adminNote = window.prompt(
            "Admin note:",
            "User suspended after report review."
        );

        if (adminNote === null) return;

        updateReport(report._id, "action-taken", {
            adminNote,
            suspendUser: true,
        });
    }

    return (
        <div className="admin-reports-page">
            <div className="admin-reports-header">
                <div>
                    <p className="admin-kicker">TalSky Safety</p>
                    <h1>Reports</h1>
                    <p>Review user reports, abuse signals, and moderation issues.</p>
                </div>

                <button className="admin-refresh-btn" onClick={loadReports}>
                    <RefreshCcw size={16} />
                    Refresh
                </button>
            </div>

            <div className="admin-reports-summary">
                <div>
                    <Flag size={18} />
                    <span>{pagination?.total || 0} total reports</span>
                </div>

                <div>
                    <ShieldAlert size={18} />
                    <span>Moderation queue</span>
                </div>
            </div>

            {loading && <div className="admin-loading-bar">Loading reports...</div>}
            {error && <div className="admin-error-bar">{error}</div>}

            <div className="admin-reports-list">
                {!loading && reports.length === 0 ? (
                    <div className="admin-empty-report">
                        <AlertTriangle size={34} />
                        <h3>No reports yet</h3>
                        <p>User reports will appear here when submitted.</p>
                    </div>
                ) : (
                    reports.map((report) => {
                        const status = report.status || "pending";
                        const isPending = status === "pending";

                        return (
                            <div className="admin-report-card" key={report._id}>
                                <div className="admin-report-top">
                                    <div>
                                        <span className="admin-report-label">Reason</span>
                                        <h2>{report.reason}</h2>
                                    </div>

                                    <div className="admin-report-top-right">
                                        <span className={`admin-report-status ${status}`}>
                                            {status.replaceAll("_", " ")}
                                        </span>

                                        <span className="admin-report-date">
                                            {report.createdAt
                                                ? new Date(report.createdAt).toLocaleString()
                                                : "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-report-users">
                                    <div className="admin-report-user-box">
                                        <span className="admin-report-label">Reporter</span>

                                        <div className="admin-report-user">
                                            <img
                                                src={getImageUrl(report.reporter?.photo)}
                                                alt={report.reporter?.name || "Reporter"}
                                            />

                                            <div>
                                                <strong>{report.reporter?.name || "Unknown"}</strong>
                                                <p>@{report.reporter?.username || "username"}</p>
                                                <small>{report.reporter?.email || "No email"}</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-report-user-box danger">
                                        <span className="admin-report-label">Reported User</span>

                                        <div className="admin-report-user">
                                            <img
                                                src={getImageUrl(report.reportedUser?.photo)}
                                                alt={report.reportedUser?.name || "Reported user"}
                                            />

                                            <div>
                                                <strong>{report.reportedUser?.name || "Unknown"}</strong>
                                                <p>@{report.reportedUser?.username || "username"}</p>
                                                <small>{report.reportedUser?.email || "No email"}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {report.details && (
                                    <div className="admin-report-details">
                                        <span className="admin-report-label">Details</span>
                                        <p>{report.details}</p>
                                    </div>
                                )}

                                {report.adminNote && (
                                    <div className="admin-report-note">
                                        <span className="admin-report-label">Admin Note</span>
                                        <p>{report.adminNote}</p>
                                    </div>
                                )}

                                {report.reviewedAt && (
                                    <div className="admin-report-reviewed">
                                        Reviewed: {new Date(report.reviewedAt).toLocaleString()}
                                    </div>
                                )}

                                <div className="admin-report-actions">
                                    <button onClick={() => openUserDetails(report.reportedUser?._id, report)}>
                                        <User size={15} />
                                        View Details
                                    </button>

                                    {isPending ? (
                                        <>
                                            <button onClick={() => markReviewed(report._id)}>
                                                <CheckCircle2 size={15} />
                                                Mark Reviewed
                                            </button>

                                            <button
                                                className="soft-danger"
                                                onClick={() => dismissReport(report._id)}
                                                disabled={actionLoading === report._id}
                                            >
                                                <XCircle size={15} />
                                                Dismiss
                                            </button>

                                            <button
                                                className="danger"
                                                onClick={() => suspendFromReport(report)}
                                                disabled={actionLoading === report._id}
                                            >
                                                <UserX size={15} />
                                                Suspend User
                                            </button>
                                        </>
                                    ) : (
                                        <span className="admin-muted-text">Report handled</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
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

            {showUserModal && (
                <AdminUserDetailsModal
                    data={userDetails}
                    report={selectedReport}
                    loading={userDetailsLoading}
                    onClose={() => {
                        setShowUserModal(false);
                        setUserDetails(null);
                        setSelectedReport(null);
                    }}
                />
            )}
        </div>
    );

}

function AdminUserDetailsModal({ data, report, loading, onClose }) {
    const user = data?.user;

    return (
        <div className="admin-modal-backdrop" onClick={onClose}>
            <div className="admin-user-modal" onClick={(e) => e.stopPropagation()}>
                <button className="admin-modal-close" onClick={onClose}>×</button>

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
                            <Info label="Verification" value={user?.verification?.status || "none"} />
                            <Info label="Plan" value={`${user?.subscription?.plan || "free"} / ${user?.subscription?.status || "inactive"}`} />
                            <Info label="Reports received" value={data?.stats?.reportsReceivedCount ?? 0} />
                            <Info label="Reports sent" value={data?.stats?.reportsSentCount ?? 0} />
                        </div>

                        {report && (
                            <div className="admin-modal-section">
                                <strong>Current report</strong>
                                <p><b>Reason:</b> {report.reason}</p>
                                <p><b>Details:</b> {report.details || "—"}</p>
                                <p><b>Status:</b> {report.status || "pending"}</p>
                            </div>
                        )}

                        {report?.evidence && (
                            <div className="admin-modal-section">
                                <strong>Evidence</strong>

                                {report.evidence.messageText ? (
                                    <p className="admin-evidence-text">{report.evidence.messageText}</p>
                                ) : null}

                                {report.evidence.fileUrls?.length > 0 ? (
                                    <div className="admin-evidence-media-grid">
                                        {report.evidence.fileUrls.map((file, index) => {
                                            const url =
                                                typeof file === "string"
                                                    ? getImageUrl(file)
                                                    : getImageUrl(file.full || file.thumb);

                                            return (
                                                <a
                                                    key={index}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="admin-evidence-media"
                                                >
                                                    {report.evidence.messageType === "image" ? (
                                                        <img src={url} alt="Evidence" />
                                                    ) : (
                                                        <span>Open media</span>
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : null}

                                {report.evidence.sentAt ? (
                                    <small>
                                        Sent at: {new Date(report.evidence.sentAt).toLocaleString()}
                                    </small>
                                ) : null}
                            </div>
                        )}
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
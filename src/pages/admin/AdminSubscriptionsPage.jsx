import { useEffect, useState } from "react";
import axios from "axios";
import {
    AlertTriangle,
    CreditCard,
    RefreshCcw,
    Search,
    ShieldCheck,
} from "lucide-react";
import { API_URL } from "../../lib/config";
import "../../styles/AdminSubscriptionsPage.css";

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setPage(1);
        }, 600);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadSubscriptions();
    }, [page, filter, debouncedQuery]);

    async function loadSubscriptions() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/subscriptions`, {
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

            setSubscriptions(res.data.subscriptions || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error(err);
            setError("Could not load subscriptions.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="admin-subscriptions-page">
            <div className="admin-subscriptions-header">
                <div>
                    <p className="admin-kicker">TalSky Billing</p>
                    <h1>Subscriptions</h1>
                    <p>Manage Stripe subscriptions, renewals, and refunds.</p>
                </div>

                <div className="admin-billing-status">
                    <ShieldCheck size={18} />
                    <span>Stripe Connected</span>
                </div>
            </div>

            <div className="admin-subscriptions-toolbar">
                <div className="admin-subscription-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search user, email, Stripe ID..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="admin-subscription-filters">
                    {["all", "active", "inactive", "canceling"].map((item) => (
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

            {loading && <div className="admin-loading-bar">Loading subscriptions...</div>}
            {error && <div className="admin-error-bar">{error}</div>}

            <div className="admin-billing-grid">
                {subscriptions.map((user) => {
                    const sub = user.subscription || {};
                    const plan = sub.plan || "free";
                    const status = sub.status || "inactive";

                    return (
                        <div className="admin-billing-card" key={user._id}>
                            <div className="admin-billing-top">
                                <div>
                                    <h2>{user.name || "No name"}</h2>
                                    <p>@{user.username || "username"}</p>
                                </div>

                                <span className={`admin-billing-plan ${plan}`}>
                                    <CreditCard size={13} />
                                    {plan}
                                </span>
                            </div>

                            <div className="admin-billing-meta">
                                <div>
                                    <span>Email</span>
                                    <strong>{user.email || "No email"}</strong>
                                </div>

                                <div>
                                    <span>Status</span>
                                    <strong className={`admin-billing-status-text ${status}`}>
                                        {status}
                                    </strong>
                                </div>

                                <div>
                                    <span>Renewal</span>
                                    <strong>
                                        {sub.currentPeriodEnd
                                            ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                                            : "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Canceling</span>
                                    <strong>{sub.cancelAtPeriodEnd ? "Yes" : "No"}</strong>
                                </div>
                            </div>

                            <div className="admin-billing-ids">
                                <div>
                                    <span>Stripe Customer</span>
                                    <code>{sub.stripeCustomerId || "—"}</code>
                                </div>

                                <div>
                                    <span>Subscription</span>
                                    <code>{sub.stripeSubscriptionId || "—"}</code>
                                </div>
                            </div>

                            {sub.cancelAtPeriodEnd && (
                                <div className="admin-cancel-warning">
                                    <AlertTriangle size={16} />
                                    <span>Subscription will end at period expiration.</span>
                                </div>
                            )}

                            <div className="admin-billing-actions">
                                <button onClick={loadSubscriptions}>
                                    <RefreshCcw size={15} />
                                    Refresh
                                </button>

                                <button className="danger">
                                    Support
                                </button>
                            </div>
                        </div>
                    );
                })}
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
    );
}
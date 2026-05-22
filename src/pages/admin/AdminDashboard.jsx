import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
    BadgeCheck,
    BarChart3,
    Bell,
    CreditCard,
    Flag,
    ShieldCheck,
    UserSearch,
    Users,
} from "lucide-react";
import "../../styles/AdminDashboard.css";
import { API_URL } from "../../lib/config";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setStats(res.data.stats || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    const statsCards = [
        {
            label: "Total Users",
            value: loading ? "—" : stats?.totalUsers || 0,
            note: "All registered accounts",
            icon: Users,
        },
        {
            label: "Pro Subscribers",
            value: loading ? "—" : stats?.proUsers || 0,
            note: "Active paid users",
            icon: CreditCard,
        },
        {
            label: "Pending Verifications",
            value: loading ? "—" : stats?.pendingVerifications || 0,
            note: "Waiting for review",
            icon: BadgeCheck,
        },
        {
            label: "Canceling Subs",
            value: loading ? "—" : stats?.cancelingSubscriptions || 0,
            note: "Will end at period end",
            icon: Flag,
        },
    ];

    const quickActions = [
        {
            title: "Review Verifications",
            description: "Approve or reject identity verification requests.",
            to: "/admin/verifications",
            icon: ShieldCheck,
        },
        {
            title: "Search Users",
            description: "Find users by email, username, or ID.",
            to: "/admin/users",
            icon: UserSearch,
        },
        {
            title: "Subscriptions",
            description: "Manage Pro users, Stripe status, and refunds.",
            to: "/admin/subscriptions",
            icon: CreditCard,
        },
        {
            title: "Reports",
            description: "Review abuse, spam, and safety reports.",
            to: "/admin/reports",
            icon: Flag,
        },
    ];

    const activity = [
        {
            title: "Admin dashboard initialized",
            description: "TalSky admin tools are ready to be expanded.",
            time: "Now",
        },
        {
            title: "Stripe billing connected",
            description: "Subscriptions, cancellations, refunds and webhooks configured.",
            time: "Today",
        },
        {
            title: "Verification center available",
            description: "Pending verification requests can be reviewed.",
            time: "Today",
        },
    ];

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-hero">
                <div>
                    <p className="admin-kicker">TalSky Admin Center</p>
                    <h1>Dashboard</h1>
                    <p>
                        Manage users, trust, billing, safety, and platform operations from one place.
                    </p>
                </div>

                <div className="admin-hero-badge">
                    <Bell size={18} />
                    <span>Admin Mode</span>
                </div>
            </div>

            <div className="admin-stats-grid">
                {statsCards.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div className="admin-stat-card" key={stat.label}>
                            <div className="admin-stat-icon">
                                <Icon size={22} />
                            </div>

                            <div>
                                <p>{stat.label}</p>
                                <h2>{stat.value}</h2>
                                <span>{stat.note}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="admin-dashboard-grid">
                <section className="admin-panel-card">
                    <div className="admin-section-header">
                        <div>
                            <h2>Quick Actions</h2>
                            <p>Most used admin workflows.</p>
                        </div>
                    </div>

                    <div className="admin-actions-grid">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <Link to={action.to} className="admin-action-card" key={action.title}>
                                    <div className="admin-action-icon">
                                        <Icon size={20} />
                                    </div>

                                    <div>
                                        <h3>{action.title}</h3>
                                        <p>{action.description}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="admin-panel-card">
                    <div className="admin-section-header">
                        <div>
                            <h2>Platform Snapshot</h2>
                            <p>Current admin focus areas.</p>
                        </div>

                        <BarChart3 size={20} />
                    </div>

                    <div className="admin-snapshot-list">
                        <div>
                            <span>Billing</span>
                            <strong>Stripe Ready</strong>
                        </div>

                        <div>
                            <span>Verification</span>
                            <strong>Manual Review</strong>
                        </div>

                        <div>
                            <span>Mobile App</span>
                            <strong>Social + AI Tutor</strong>
                        </div>

                        <div>
                            <span>Web App</span>
                            <strong>AI Tutor + Billing</strong>
                        </div>
                    </div>
                </section>
            </div>

            <section className="admin-panel-card">
                <div className="admin-section-header">
                    <div>
                        <h2>Recent Activity</h2>
                        <p>Important platform events will appear here.</p>
                    </div>
                </div>

                <div className="admin-activity-list">
                    {activity.map((item) => (
                        <div className="admin-activity-item" key={item.title}>
                            <div className="admin-activity-dot" />

                            <div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>

                            <span>{item.time}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
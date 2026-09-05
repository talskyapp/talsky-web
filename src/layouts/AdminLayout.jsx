import { NavLink, Outlet } from "react-router-dom";
import {
    BadgeCheck,
    BarChart3,
    CreditCard,
    Flag,
    LogOut,
    LayoutDashboard,
    Shield,
    ShieldCheck,
    Users,
    Gift,
} from "lucide-react";
import "../styles/AdminLayout.css";

const navItems = [
    {
        label: "Dashboard",
        to: "/admin",
        icon: LayoutDashboard,
    },
    {
        label: "Users",
        to: "/admin/users",
        icon: Users,
    },
    {
        label: "Subscriptions",
        to: "/admin/subscriptions",
        icon: CreditCard,
    },
    {
        label: "Offers",
        to: "/admin/offers",
        icon: Gift,
    },
    {
        label: "Verifications",
        to: "/admin/verifications",
        icon: BadgeCheck,
    },
    {
        label: "Reports",
        to: "/admin/reports",
        icon: Flag,
    },
    {
        label: "Analytics",
        to: "/admin/analytics",
        icon: BarChart3,
    },
    {
        label: "Moderation Logs",
        to: "/admin/moderation-logs",
        icon: ShieldCheck,
    }
];

export default function AdminLayout() {
    let admin = {};

    try {
        admin = JSON.parse(localStorage.getItem("admin") || "{}");
    } catch { }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-top">
                    <div className="admin-logo">
                        <div className="admin-logo-icon">
                            <Shield size={18} />
                        </div>

                        <div>
                            <h2>TalSky</h2>
                            <span>Admin Panel</span>
                        </div>
                    </div>

                    <nav className="admin-nav">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === "/admin"}
                                    className={({ isActive }) =>
                                        `admin-nav-link ${isActive ? "active" : ""}`
                                    }
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                <div className="admin-sidebar-footer">
                    <div className="admin-admin-card">
                        <div className="admin-admin-avatar">
                            {(admin?.name || "A").charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <strong>{admin?.name || "Admin"}</strong>
                            <span>{admin?.email || "admin@talsky.app"}</span>
                        </div>
                    </div>

                    <button
                        className="admin-logout-btn"
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("admin");
                            localStorage.removeItem("user");

                            window.location.href = "/login";
                        }}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main-content">
                <Outlet />
            </main>
        </div>
    );
}
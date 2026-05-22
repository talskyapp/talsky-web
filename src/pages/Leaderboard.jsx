import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { API_URL } from "../lib/config";
import "../styles/Leaderboard.css";

export default function Leaderboard() {
    const navigate = useNavigate();
    const { user } = useOutletContext();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [leaders, setLeaders] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [weekRange, setWeekRange] = useState({
        weekStart: "",
        weekEnd: "",
    });

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError("");

                const query = new URLSearchParams();
                query.set("limit", "10");

                if (user?._id) {
                    query.set("userId", user._id);
                }

                const res = await fetch(
                    `${API_URL}/api/leaderboard/weekly?${query.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error("Failed to load leaderboard");
                }

                const data = await res.json();

                setLeaders(Array.isArray(data.leaderboard) ? data.leaderboard : []);
                setUserRank(data.userRank || null);
                setWeekRange({
                    weekStart: data.weekStart || "",
                    weekEnd: data.weekEnd || "",
                });
            } catch (err) {
                console.error("Leaderboard error:", err);
                setError("Could not load leaderboard.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchLeaderboard();
        }
    }, [token, user?._id]);

    const formattedRange = useMemo(() => {
        if (!weekRange.weekStart || !weekRange.weekEnd) return "";

        const start = new Date(weekRange.weekStart);
        const end = new Date(weekRange.weekEnd);

        const format = (date) =>
            date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });

        return `${format(start)} - ${format(end)}`;
    }, [weekRange]);

    if (loading) {
        return (
            <div className="leaderboard-page">
                <div className="leaderboard-shell">
                    <div className="leaderboard-card">Loading leaderboard...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-page">
                <div className="leaderboard-shell">
                    <div className="leaderboard-card">
                        <h2>Leaderboard</h2>
                        <p>{error}</p>

                        <button
                            className="leaderboard-secondary-btn"
                            type="button"
                            onClick={() => navigate(-1)}
                        >
                            Go back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-shell">
                <div className="leaderboard-header-card">
                    <div>
                        <p className="leaderboard-kicker">Community ranking</p>
                        <h1>Weekly Leaderboard</h1>
                        <p className="leaderboard-subtext">
                            Earn XP by completing lessons and climb the ranking.
                        </p>
                    </div>

                    <div className="leaderboard-range-pill">
                        <span>🏆</span>
                        <span>{formattedRange || "This week"}</span>
                    </div>
                </div>

                {userRank && (
                    <div className="leaderboard-user-card">
                        <div className="leaderboard-user-left">
                            <div className="leaderboard-user-rank-badge">
                                #{userRank.rank}
                            </div>

                            <img
                                src={userRank.photo || "/default-avatar.jpg"}
                                alt={userRank.name || "You"}
                                className="leaderboard-user-avatar"
                            />

                            <div>
                                <div className="leaderboard-user-title">Your rank</div>
                                <div className="leaderboard-user-name">
                                    {userRank.name || userRank.username || "You"}
                                </div>
                            </div>
                        </div>

                        <div className="leaderboard-user-stats">
                            <div className="leaderboard-stat-box">
                                <span className="leaderboard-stat-label">XP</span>
                                <strong>{userRank.weeklyXp || 0}</strong>
                            </div>

                            <div className="leaderboard-stat-box">
                                <span className="leaderboard-stat-label">Lessons</span>
                                <strong>{userRank.lessonsCompleted || 0}</strong>
                            </div>

                            <div className="leaderboard-stat-box">
                                <span className="leaderboard-stat-label">Best</span>
                                <strong>{userRank.bestScore || 0}%</strong>
                            </div>
                        </div>
                    </div>
                )}

                <div className="leaderboard-card">
                    <div className="leaderboard-list-header">
                        <h2>Top Learners</h2>
                        <button
                            className="leaderboard-secondary-btn"
                            type="button"
                            onClick={() => navigate("/dashboard/learn")}
                        >
                            Back to Learn
                        </button>
                    </div>

                    {leaders.length === 0 ? (
                        <div className="leaderboard-empty">
                            No ranking data yet. Complete a lesson to appear here.
                        </div>
                    ) : (
                        <div className="leaderboard-list">
                            {leaders.map((entry, index) => {
                                const isMe =
                                    user?._id &&
                                    String(entry.userId) === String(user._id);

                                return (
                                    <div
                                        key={`${entry.userId}-${index}`}
                                        className={`leaderboard-row ${isMe ? "is-me" : ""}`}
                                    >
                                        <div className="leaderboard-row-left">
                                            <div
                                                className={`leaderboard-rank medal-${entry.rank <= 3 ? entry.rank : "default"
                                                    }`}
                                            >
                                                {entry.rank}
                                            </div>

                                            <img
                                                src={entry.photo || "/default-avatar.jpg"}
                                                alt={entry.name || entry.username || "user"}
                                                className="leaderboard-avatar"
                                            />

                                            <div className="leaderboard-user-meta">
                                                <div className="leaderboard-name">
                                                    {entry.name || entry.username || "User"}
                                                    {isMe && (
                                                        <span className="leaderboard-me-badge">
                                                            You
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="leaderboard-username">
                                                    @{entry.username || "user"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="leaderboard-row-right">
                                            <div className="leaderboard-xp">
                                                {entry.weeklyXp || 0} XP
                                            </div>
                                            <div className="leaderboard-lessons">
                                                {entry.lessonsCompleted || 0} lessons
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
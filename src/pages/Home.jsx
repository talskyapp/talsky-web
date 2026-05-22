import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../lib/config";

export default function Home() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (!res.ok) {
                    console.error(data);
                    navigate("/login");
                    return;
                }

                setUser(data.user);

            } catch (err) {
                console.error(err);
                navigate("/login");
            }
        };

        fetchUser();
    }, [navigate]);

    if (!user) return <p>Loading...</p>;

    return (
        <div className="home-container">
            <h1>Welcome, {user.name} 👋</h1>

            <div className="profile-card">
                <p><strong>Learning:</strong> {user.languageToLearn}</p>
                <p><strong>Native language:</strong> {user.nativeLanguage}</p>
                <p><strong>Goal:</strong> {user.goal}</p>
                <p><strong>Level:</strong> {user.level}</p>
            </div>

            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                }}
            >
                Logout
            </button>
        </div>
    );
}
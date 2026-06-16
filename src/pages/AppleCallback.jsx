import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../lib/config";

export default function AppleCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState("");

    useEffect(() => {
        async function finishAppleLogin() {
            try {
                const code = params.get("code");

                if (!code) {
                    setError("Apple login was cancelled or failed.");
                    return;
                }

                const res = await fetch(`${API_URL}/api/auth/apple-web`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data?.token || !data?.user) {
                    setError(data?.msg || "Apple login failed.");
                    return;
                }

                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

                if (data.user?.isAdmin) {
                    navigate("/admin/dashboard", { replace: true });
                } else if (!data.user.onboardingCompleted) {
                    navigate("/onboarding", { replace: true });
                } else if (!data.user.profileCompleted) {
                    navigate("/dashboard/create-profile", { replace: true });
                } else {
                    navigate("/", { replace: true });
                }
            } catch (err) {
                console.error("APPLE CALLBACK ERROR:", err);
                setError("Apple login failed. Please try again.");
            }
        }

        finishAppleLogin();
    }, [params, navigate]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui",
            padding: 24,
            textAlign: "center",
        }}>
            {error ? (
                <div>
                    <h2>Apple login failed</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate("/login")}>
                        Back to login
                    </button>
                </div>
            ) : (
                <div>
                    <h2>Signing you in...</h2>
                    <p>Please wait a moment.</p>
                </div>
            )}
        </div>
    );
}
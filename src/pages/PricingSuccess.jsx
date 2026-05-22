import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PricingSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            const token = localStorage.getItem("token");

            if (token) {
                const myId = JSON.parse(atob(token.split(".")[1])).id;
                navigate(`/dashboard/profile/${myId}`);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center"
        }}>
            <h1>🎉 Payment Successful!</h1>
            <p>You are now a Pro user.</p>
            <p>Redirecting...</p>
        </div>
    );
}
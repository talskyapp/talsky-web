import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../lib/config";

export default function useSubscription() {
    const [subscription, setSubscription] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = useCallback(async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/subscription/status`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to load subscription");
            }

            setSubscription(data.subscription);
            setUsage(data.usage);
        } catch (error) {
            console.error("useSubscription error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    return {
        subscription,
        usage,
        loading,
        refreshSubscription: fetchSubscription,
        isPro:
            subscription?.plan === "pro" &&
            subscription?.status === "active",
        features: subscription?.features || {},
    };
}
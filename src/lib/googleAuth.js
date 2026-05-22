import { API_URL } from "./config";

let googleScriptPromise = null;
let googleInitialized = false;

function loadGoogleScript() {
    if (googleScriptPromise) return googleScriptPromise;

    googleScriptPromise = new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }

        const existing = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () =>
                reject(new Error("Failed to load Google script"))
            );
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google script"));
        document.body.appendChild(script);
    });

    return googleScriptPromise;
}

export async function initGoogleButton(renderEl, onSuccess, onError) {
    await loadGoogleScript();

    if (!renderEl) return;

    if (!googleInitialized) {
        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    if (!response?.credential) {
                        onError?.("Google did not return a credential.");
                        return;
                    }

                    const res = await fetch(`${API_URL}/api/auth/google`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            credential: response.credential,
                        }),
                    });

                    const data = await res.json();
                    console.log("Google login response:", data);

                    if (!res.ok) {
                        onError?.(data.msg || "Google login failed.");
                        return;
                    }

                    onSuccess?.(data);
                } catch (err) {
                    console.error(err);
                    onError?.("Google login failed.");
                }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
        });

        googleInitialized = true;
    }

    renderEl.innerHTML = "";

    window.google.accounts.id.renderButton(renderEl, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 380,
    });
}
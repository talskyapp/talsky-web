import { io } from "socket.io-client";
import { SOCKET_URL } from "./lib/config";

let socket;

function getUserIdFromToken() {
    try {
        const token = localStorage.getItem("token");

        if (!token) return null;

        const payload = JSON.parse(atob(token.split(".")[1]));

        return payload?.id || null;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error("Invalid socket authentication token:", error);
        }

        return null;
    }
}

export function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            const myId = getUserIdFromToken();

            if (myId) {
                socket.emit("register_user", myId);
            }
        });

        socket.on("connect_error", (error) => {
            if (import.meta.env.DEV) {
                console.error("Socket connection error:", error.message);
            }
        });
    }

    return socket;
}
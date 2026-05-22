import { io } from "socket.io-client";
import { SOCKET_URL } from "./lib/config";

let socket;

export function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            console.log("🟢 Connected:", socket.id);

            const token = localStorage.getItem("token");
            const myId = token
                ? JSON.parse(atob(token.split(".")[1])).id
                : null;

            if (myId) {
                socket.emit("register_user", myId);
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("🟠 Disconnected:", reason);
        });

        socket.on("connect_error", (err) => {
            console.error("🔴 Socket connect error:", err.message);
        });
    }

    return socket;
}
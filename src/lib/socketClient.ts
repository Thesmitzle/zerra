import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Zerra] Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Zerra] Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[Zerra] Connection error:", err.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

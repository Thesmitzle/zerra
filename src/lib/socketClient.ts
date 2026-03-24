import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
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
```

Spremi **Ctrl+S**, zatvori.

Sad otvori:
```
notepad src\components\ChatRoom.tsx
```

Pronađi ovu liniju:
```
{!connected && keyLoaded && (
        <div className="text-center py-2 text-xs text-yellow-400 bg-yellow-400/10 border-b border-yellow-400/20">
          ⚠ Reconnecting…
        </div>
      )}
```

Zamijeni s:
```
{!connected && keyLoaded && (
        <div className="text-center py-3 text-xs bg-surface-2 border-b border-border">
          <p className="text-text-muted mb-2">⚠ Veza prekinuta</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-press bg-accent text-bg text-xs font-bold px-4 py-1.5 rounded-lg hover:shadow-glow transition-all"
          >
            Reconnect
          </button>
        </div>
      )}
/**
 * Zerra — Custom Express + Socket.io Server
 * The server NEVER sees plaintext. It only relays encrypted blobs.
 */

const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const next = require("next");
const { v4: uuidv4 } = require("uuid");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Room store ────────────────────────────────────────────────────────────────
// rooms[roomId] = { createdAt, expiresAt, messages: [], participants: Set }
const rooms = new Map();

const ROOM_EXPIRY_OPTIONS = {
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

function createRoom(expiry = "24h") {
  const roomId = uuidv4().replace(/-/g, "").slice(0, 12);
  const expiryMs = ROOM_EXPIRY_OPTIONS[expiry] || ROOM_EXPIRY_OPTIONS["24h"];
  rooms.set(roomId, {
    id: roomId,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiryMs,
    messages: [],
    participants: new Set(),
    messageCount: 0,
  });
  return roomId;
}

function getRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (Date.now() > room.expiresAt) {
    rooms.delete(roomId);
    return null;
  }
  return room;
}

function cleanExpiredRooms() {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now > room.expiresAt) {
      rooms.delete(id);
    }
  }
}
setInterval(cleanExpiredRooms, 60 * 1000); // every minute

// ── Rate limiter ──────────────────────────────────────────────────────────────
const rateLimits = new Map();
function isRateLimited(socketId) {
  const now = Date.now();
  const last = rateLimits.get(socketId) || 0;
  if (now - last < 1000) return true; // 1 message/sec
  rateLimits.set(socketId, now);
  return false;
}

// ── Boot ──────────────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const expressApp = express();
  expressApp.use(express.json());

  // REST: create room
  expressApp.post("/api/rooms", (req, res) => {
    const { expiry } = req.body;
    const roomId = createRoom(expiry);
    res.json({ roomId });
  });

  // REST: validate room exists
  expressApp.get("/api/rooms/:roomId", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found or expired" });
    res.json({
      roomId: room.id,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      participantCount: room.participants.size,
    });
  });

  // Next.js handler
  expressApp.all("*", (req, res) => handle(req, res));

  const httpServer = createServer(expressApp);

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "*" : process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let displayName = null;

    // ── Join room ────────────────────────────────────────────────────────────
    socket.on("join-room", ({ roomId, name }, callback) => {
      const room = getRoom(roomId);
      if (!room) {
        return callback?.({ error: "Room not found or expired" });
      }

      currentRoomId = roomId;
      displayName = name || "Anonymous";
      room.participants.add(socket.id);

      socket.join(roomId);

      // Send room metadata to joiner
      callback?.({
        success: true,
        expiresAt: room.expiresAt,
        participantCount: room.participants.size,
      });

      // Notify others
      socket.to(roomId).emit("user-joined", {
        name: displayName,
        participantCount: room.participants.size,
      });
    });

    // ── Send message (encrypted blob — server never decrypts) ────────────────
    socket.on("send-message", (payload, callback) => {
      if (!currentRoomId) return callback?.({ error: "Not in a room" });
      if (isRateLimited(socket.id)) return callback?.({ error: "Rate limited" });

      const room = getRoom(currentRoomId);
      if (!room) return callback?.({ error: "Room expired" });

      // Validate payload has encrypted fields only
      const { encryptedData, iv, selfDestructMs, messageId } = payload;
      if (!encryptedData || !iv || !messageId) {
        return callback?.({ error: "Invalid message format" });
      }

      const message = {
        id: messageId,
        encryptedData, // base64 — server cannot read
        iv,            // base64 — server cannot read
        selfDestructMs: Math.min(selfDestructMs || 0, 24 * 60 * 60 * 1000),
        senderId: socket.id,
        senderName: displayName,
        timestamp: Date.now(),
      };

      room.messages.push(message);
      room.messageCount++;

      // Relay to room (including sender for confirmation)
      io.to(currentRoomId).emit("new-message", message);
      callback?.({ success: true });
    });

    // ── Delete message ────────────────────────────────────────────────────────
    socket.on("delete-message", ({ messageId }) => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (!room) return;

      room.messages = room.messages.filter((m) => m.id !== messageId);
      io.to(currentRoomId).emit("message-deleted", { messageId });
    });

    // ── Typing indicator ─────────────────────────────────────────────────────
    socket.on("typing", ({ isTyping }) => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit("peer-typing", {
        name: displayName,
        isTyping,
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (!currentRoomId) return;
      const room = getRoom(currentRoomId);
      if (room) {
        room.participants.delete(socket.id);
        io.to(currentRoomId).emit("user-left", {
          name: displayName,
          participantCount: room.participants.size,
        });
      }
      rateLimits.delete(socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`\n🔐 Zerra is live → http://${hostname}:${port}`);
    console.log(`   Mode: ${dev ? "development" : "production"}\n`);
  });
});

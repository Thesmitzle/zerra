/**
 * Zerra — Custom Express + Socket.io Server s Redis persistencijom
 * Server NIKAD ne vidi plaintext. Samo releja enkriptirane blobove.
 */

const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const next = require("next");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// ── Redis klijent ─────────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  lazyConnect: false,
});

redis.on("connect", () => console.log("[Redis] Spojen ✅"));
redis.on("error", (err) => console.error("[Redis] Greška:", err.message));

// ── Room helpers ──────────────────────────────────────────────────────────────
const ROOM_EXPIRY_OPTIONS = {
  "15m": 15 * 60,
  "30m": 30 * 60,
  "1h":  60 * 60,
};

async function createRoom(expiry = "30m") {
  const roomId = uuidv4().replace(/-/g, "").slice(0, 12);
  const ttl = ROOM_EXPIRY_OPTIONS[expiry] || ROOM_EXPIRY_OPTIONS["30m"];
  const expiresAt = Date.now() + ttl * 1000;

  const roomData = {
    id: roomId,
    createdAt: Date.now(),
    expiresAt,
    messageCount: 0,
    participants: 0,
  };

  await redis.setex(`room:${roomId}`, ttl, JSON.stringify(roomData));
  return roomId;
}

async function getRoom(roomId) {
  const data = await redis.get(`room:${roomId}`);
  if (!data) return null;
  return JSON.parse(data);
}

async function updateRoom(roomId, updates) {
  const room = await getRoom(roomId);
  if (!room) return null;
  const updated = { ...room, ...updates };
  const ttl = await redis.ttl(`room:${roomId}`);
  if (ttl > 0) {
    await redis.setex(`room:${roomId}`, ttl, JSON.stringify(updated));
  }
  return updated;
}

async function saveMessage(roomId, message) {
  const ttl = await redis.ttl(`room:${roomId}`);
  if (ttl <= 0) return;
  await redis.setex(
    `msg:${roomId}:${message.id}`,
    ttl,
    JSON.stringify(message)
  );
  await redis.expire(`room:${roomId}`, ttl);
}

async function deleteMessage(roomId, messageId) {
  await redis.del(`msg:${roomId}:${messageId}`);
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
const rateLimits = new Map();
function isRateLimited(socketId) {
  const now = Date.now();
  const last = rateLimits.get(socketId) || 0;
  if (now - last < 1000) return true;
  rateLimits.set(socketId, now);
  return false;
}

// ── Boot ──────────────────────────────────────────────────────────────────────
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  expressApp.use(express.json());

  // REST: kreiraj sobu
  expressApp.post("/api/rooms", async (req, res) => {
    try {
      const { expiry } = req.body;
      const roomId = await createRoom(expiry);
      res.json({ roomId });
    } catch (err) {
      console.error("[API] Greška pri kreiranju sobe:", err);
      res.status(500).json({ error: "Greška servera" });
    }
  });

  // REST: provjeri sobu
  expressApp.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const room = await getRoom(req.params.roomId);
      if (!room) return res.status(404).json({ error: "Soba nije pronađena ili je istekla" });
      res.json({
        roomId: room.id,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        participantCount: room.participants || 0,
      });
    } catch (err) {
      res.status(500).json({ error: "Greška servera" });
    }
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

  // Prati aktivne sudionike u memoriji (samo za Socket.io sesiju)
  const roomParticipants = new Map();

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let displayName = null;

    // ── Join room ────────────────────────────────────────────────────────────
    socket.on("join-room", async ({ roomId, name }, callback) => {
      try {
        const room = await getRoom(roomId);
        if (!room) {
          return callback?.({ error: "Soba nije pronađena ili je istekla" });
        }

        currentRoomId = roomId;
        displayName = name || "Anonymous";

        // Prati sudionike
        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Set());
        }
        roomParticipants.get(roomId).add(socket.id);
        const participantCount = roomParticipants.get(roomId).size;

        socket.join(roomId);

        callback?.({
          success: true,
          expiresAt: room.expiresAt,
          participantCount,
        });

        socket.to(roomId).emit("user-joined", {
          name: displayName,
          participantCount,
        });
      } catch (err) {
        callback?.({ error: "Greška servera" });
      }
    });

    // ── Pošalji poruku ────────────────────────────────────────────────────────
    socket.on("send-message", async (payload, callback) => {
      if (!currentRoomId) return callback?.({ error: "Nisi u sobi" });
      if (isRateLimited(socket.id)) return callback?.({ error: "Previše poruka" });

      try {
        const room = await getRoom(currentRoomId);
        if (!room) return callback?.({ error: "Soba je istekla" });

        const { encryptedData, iv, selfDestructMs, messageId, replyTo } = payload;
        if (!encryptedData || !iv || !messageId) {
          return callback?.({ error: "Neispravan format poruke" });
        }

        const message = {
          id: messageId,
          encryptedData,
          iv,
          selfDestructMs: Math.min(selfDestructMs || 0, 24 * 60 * 60 * 1000),
          senderId: socket.id,
          senderName: displayName,
          timestamp: Date.now(),
          replyTo: replyTo || null,
        };

        await saveMessage(currentRoomId, message);
        io.to(currentRoomId).emit("new-message", message);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: "Greška servera" });
      }
    });

    // ── Briši poruku ──────────────────────────────────────────────────────────
    socket.on("delete-message", async ({ messageId }) => {
      if (!currentRoomId) return;
      await deleteMessage(currentRoomId, messageId);
      io.to(currentRoomId).emit("message-deleted", { messageId });
    });

    // ── Typing indikator ─────────────────────────────────────────────────────
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

      if (roomParticipants.has(currentRoomId)) {
        roomParticipants.get(currentRoomId).delete(socket.id);
        const participantCount = roomParticipants.get(currentRoomId).size;

        if (participantCount === 0) {
          roomParticipants.delete(currentRoomId);
        }

        io.to(currentRoomId).emit("user-left", {
          name: displayName,
          participantCount,
        });
      }

      rateLimits.delete(socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`\n🔐 Zerra je live → http://${hostname}:${port}`);
    console.log(`   Mode: ${dev ? "development" : "production"}`);
    console.log(`   Redis: ${process.env.REDIS_URL ? "✅ Spojen" : "⚠️ Lokalni"}\n`);
  });
});
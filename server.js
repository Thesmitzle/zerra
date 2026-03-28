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
const multer = require("multer");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// ── Redis klijent ─────────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("connect", () => console.log("[Redis] Spojen ✅"));
redis.on("error", (err) => console.error("[Redis] Greška:", err.message));

// ── Multer — file upload (in-memory, max 5MB) ─────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
  const roomData = { id: roomId, createdAt: Date.now(), expiresAt, participants: 0 };
  await redis.setex(`room:${roomId}`, ttl, JSON.stringify(roomData));
  return roomId;
}

async function getRoom(roomId) {
  const data = await redis.get(`room:${roomId}`);
  if (!data) return null;
  return JSON.parse(data);
}

async function saveMessage(roomId, message) {
  const ttl = await redis.ttl(`room:${roomId}`);
  if (ttl <= 0) return;
  await redis.setex(`msg:${roomId}:${message.id}`, ttl, JSON.stringify(message));
}

async function deleteMessage(roomId, messageId) {
  await redis.del(`msg:${roomId}:${messageId}`);
}

// ── Rate limiter — poruke (sliding window, dopušta burst) ─────────────────────
const rateLimits = new Map();
function isRateLimited(socketId) {
  const now = Date.now();
  const WINDOW_MS = 3000;  // 3 sekunde prozor
  const MAX_MSGS  = 5;     // max 5 poruka u tom prozoru

  if (!rateLimits.has(socketId)) rateLimits.set(socketId, []);
  const timestamps = rateLimits.get(socketId).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_MSGS) return true;
  timestamps.push(now);
  rateLimits.set(socketId, timestamps);
  return false;
}

// ── Rate limiter — kreiranje soba ─────────────────────────────────────────────
const roomCreationLimits = new Map();
function isRoomCreationLimited(ip) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  if (!roomCreationLimits.has(ip)) roomCreationLimits.set(ip, []);
  const timestamps = roomCreationLimits.get(ip).filter(t => now - t < hour);
  if (timestamps.length >= 5) return true;
  timestamps.push(now);
  roomCreationLimits.set(ip, timestamps);
  return false;
}

setInterval(() => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  for (const [ip, timestamps] of roomCreationLimits.entries()) {
    const fresh = timestamps.filter(t => now - t < hour);
    if (fresh.length === 0) roomCreationLimits.delete(ip);
    else roomCreationLimits.set(ip, fresh);
  }
}, 60 * 60 * 1000);

// ── Boot ──────────────────────────────────────────────────────────────────────
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();

  expressApp.use((req, res, next) => {
    if (req.path.startsWith("/api/") && !req.path.startsWith("/api/rooms")) {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // REST: kreiraj sobu
  expressApp.post("/api/rooms", async (req, res) => {
    try {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      if (isRoomCreationLimited(ip)) {
        return res.status(429).json({ error: "Previše soba — pokušaj za sat vremena" });
      }
      const { expiry } = req.body;
      const roomId = await createRoom(expiry);
      res.json({ roomId });
    } catch (err) {
      console.error("[API] Greška:", err);
      res.status(500).json({ error: "Greška servera" });
    }
  });

  // REST: provjeri sobu
  expressApp.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const room = await getRoom(req.params.roomId);
      if (!room) return res.status(404).json({ error: "Soba nije pronađena ili je istekla" });
      res.json({ roomId: room.id, expiresAt: room.expiresAt, participantCount: room.participants || 0 });
    } catch (err) {
      res.status(500).json({ error: "Greška servera" });
    }
  });

  // ── File Upload ───────────────────────────────────────────────────────────────
  expressApp.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const { roomId, fileName, fileType, iv } = req.body;
      if (!req.file || !roomId || !fileName || !iv) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const room = await getRoom(roomId);
      if (!room) return res.status(404).json({ error: "Room not found or expired" });

      const fileId = uuidv4().replace(/-/g, "").slice(0, 16);

      const ttl = await redis.ttl(`room:${roomId}`);
      if (ttl <= 0) return res.status(404).json({ error: "Room expired" });

      const fileData = {
        id: fileId,
        roomId,
        fileName,
        fileType: fileType || "application/octet-stream",
        iv,
        data: req.file.buffer.toString("base64"),
        size: req.file.size,
        uploadedAt: Date.now(),
      };

      await redis.setex(`file:${fileId}`, ttl, JSON.stringify(fileData));

      res.json({ fileId, fileName, fileType, size: req.file.size });
    } catch (err) {
      console.error("[Upload] Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // ── File Download ─────────────────────────────────────────────────────────────
  expressApp.get("/api/files/:fileId", async (req, res) => {
    try {
      const raw = await redis.get(`file:${req.params.fileId}`);
      if (!raw) return res.status(404).json({ error: "File not found or expired" });

      const fileData = JSON.parse(raw);

      res.json({
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        iv: fileData.iv,
        size: fileData.size,
        data: fileData.data,
      });
    } catch (err) {
      res.status(500).json({ error: "Download failed" });
    }
  });

  // Next.js handler
  expressApp.use("/api", (req, res, next) => { next(); });
  expressApp.all("*", (req, res) => { return handle(req, res); });

  const httpServer = createServer(expressApp);

  // ── Socket.io — s povećanim timeoutima ───────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "*" : process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,      // 60s prije nego server proglasi klijenta mrtvim
    pingInterval: 25000,     // ping svakih 25s
    connectTimeout: 45000,   // 45s za uspostavu konekcije
    maxHttpBufferSize: 5e6,  // 5MB — konzistentno s multer limitom
  });

  const roomParticipants = new Map();

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let displayName = null;

    socket.on("join-room", async ({ roomId, name }, callback) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return callback?.({ error: "Soba nije pronađena ili je istekla" });
        currentRoomId = roomId;
        displayName = name || "Anonymous";
        if (!roomParticipants.has(roomId)) roomParticipants.set(roomId, new Set());
        roomParticipants.get(roomId).add(socket.id);
        const participantCount = roomParticipants.get(roomId).size;
        socket.join(roomId);
        callback?.({ success: true, expiresAt: room.expiresAt, participantCount });
        socket.to(roomId).emit("user-joined", { name: displayName, participantCount });
      } catch (err) {
        callback?.({ error: "Greška servera" });
      }
    });

    socket.on("send-message", async (payload, callback) => {
      if (!currentRoomId) return callback?.({ error: "Nisi u sobi" });
      if (isRateLimited(socket.id)) return callback?.({ error: "Previše poruka — uspori malo" });
      try {
        const room = await getRoom(currentRoomId);
        if (!room) return callback?.({ error: "Soba je istekla" });
        const { encryptedData, iv, selfDestructMs, messageId, replyTo } = payload;
        if (!encryptedData || !iv || !messageId) return callback?.({ error: "Neispravan format" });
        const message = {
          id: messageId,
          encryptedData, iv,
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

    // ── File share notification ───────────────────────────────────────────────
    socket.on("share-file", async (payload, callback) => {
      if (!currentRoomId) return callback?.({ error: "Nisi u sobi" });
      try {
        const { fileId, fileName, fileType, size, messageId } = payload;
        const message = {
          id: messageId,
          type: "file",
          fileId, fileName, fileType, size,
          senderId: socket.id,
          senderName: displayName,
          timestamp: Date.now(),
        };
        await saveMessage(currentRoomId, message);
        io.to(currentRoomId).emit("new-file", message);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: "Greška servera" });
      }
    });

    socket.on("delete-message", async ({ messageId }) => {
      if (!currentRoomId) return;
      await deleteMessage(currentRoomId, messageId);
      io.to(currentRoomId).emit("message-deleted", { messageId });
    });

    socket.on("typing", ({ isTyping }) => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit("peer-typing", { name: displayName, isTyping });
    });

    socket.on("disconnect", () => {
      if (!currentRoomId) return;
      if (roomParticipants.has(currentRoomId)) {
        roomParticipants.get(currentRoomId).delete(socket.id);
        const participantCount = roomParticipants.get(currentRoomId).size;
        if (participantCount === 0) roomParticipants.delete(currentRoomId);
        io.to(currentRoomId).emit("user-left", { name: displayName, participantCount });
      }
      rateLimits.delete(socket.id);
    });
  });

  // Provjera isteklih soba svakih 30 sekundi
  setInterval(async () => {
    for (const [roomId, participants] of roomParticipants.entries()) {
      const room = await getRoom(roomId);
      if (!room) {
        io.to(roomId).emit("room-expired");
        participants.clear();
        roomParticipants.delete(roomId);
        console.log(`[Zerra] Room ${roomId} expired — kicked all users`);
      }
    }
  }, 30 * 1000);

  httpServer.listen(port, hostname, () => {
    console.log(`\n🔐 Zerra je live → http://${hostname}:${port}`);
    console.log(`   Mode: ${dev ? "development" : "production"}`);
    console.log(`   Redis: ${process.env.REDIS_URL ? "✅ Spojen" : "⚠️ Lokalni"}\n`);
  });
});

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  importKeyFromBase64,
  getKeyFromFragment,
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile,
} from "@/lib/crypto";
import { getSocket } from "@/lib/socketClient";
import { TopBar } from "./TopBar";
import { MessageBubble, SystemMessage } from "./MessageBubble";
import type { ReplyTo } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { WelcomeModal } from "./WelcomeModal";
import { usePrivacy } from "@/hooks/usePrivacy";
import type {
  EncryptedMessage,
  DecryptedMessage,
  RoomMeta,
  TypingState,
} from "@/types";

type SystemEntry = { type: "system"; id: string; text: string };
type MessageEntry = DecryptedMessage & { type: "message"; replyTo?: ReplyTo };
type FileEntry = {
  type: "file";
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  size: number;
  senderId: string;
  senderName: string;
  timestamp: number;
  isOwn: boolean;
};
type ChatEntry = MessageEntry | SystemEntry | FileEntry;

interface ChatRoomProps {
  roomId: string;
}

function playChessSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.6
               + Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 40) * 0.4;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    setTimeout(() => ctx.close(), 200);
  } catch (e) {}
}

async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function sendNotification(senderName: string, text: string) {
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    new Notification(`Zerra — ${senderName}`, {
      body: text.length > 60 ? text.slice(0, 60) + "…" : text,
      icon: "/favicon.svg",
      silent: true,
    });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  if (fileType.includes("zip") || fileType.includes("rar")) return "🗜️";
  return "📎";
}

function FileBubble({ entry, cryptoKey, isOwn }: { entry: FileEntry; cryptoKey: CryptoKey; isOwn: boolean }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/files/${entry.fileId}`);
      if (!res.ok) throw new Error("File not found");
      const data = await res.json();

      // Dekriptiraj
      const encryptedBytes = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
      const decryptedBuffer = await decryptFile(encryptedBytes.buffer, data.iv, cryptoKey);

      // Download
      const blob = new Blob([decryptedBuffer], { type: data.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download file. It may have expired.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-xs rounded-2xl border px-4 py-3 ${isOwn ? "bg-accent/10 border-accent/30" : "bg-surface-2 border-border"}`}>
        {!isOwn && <p className="text-xs font-semibold text-accent mb-2">{entry.senderName}</p>}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "24px" }}>{getFileIcon(entry.fileType)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{entry.fileName}</p>
            <p className="text-xs text-text-muted">{formatFileSize(entry.size)}</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-press flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-accent text-bg hover:shadow-glow transition-all disabled:opacity-50"
          >
            {downloading ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-text-muted/50 mt-2 text-right">
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} 🔒
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne)" }}>Room unavailable</h2>
      <p className="text-text-muted text-sm max-w-xs">{message}</p>
      <button
        onClick={() => window.location.href = "/"}
        className="btn-press bg-accent text-bg font-semibold px-6 py-2.5 rounded-xl text-sm hover:shadow-glow transition-all"
      >
        Create a new room
      </button>
    </div>
  );
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [keyBase64, setKeyBase64] = useState<string | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [welcomeSeen, setWelcomeSeen] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  usePrivacy(displayName || "");
  const [roomMeta, setRoomMeta] = useState<RoomMeta | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasJoined = useRef(false);

  useEffect(() => {
    const raw = getKeyFromFragment();
    if (!raw) { setKeyError(true); return; }
    setKeyBase64(raw);
    importKeyFromBase64(raw).then((key) => {
      setCryptoKey(key);
      setKeyLoaded(true);
    }).catch(() => setKeyError(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, typing]);

  const addSystem = useCallback((text: string) => {
    setEntries((prev) => [...prev, { type: "system" as const, id: uuidv4(), text }]);
  }, []);

  const addMessage = useCallback(async (msg: EncryptedMessage, key: CryptoKey, mySocketId: string) => {
    try {
      const plaintext = await decryptMessage({ encryptedData: msg.encryptedData, iv: msg.iv }, key);
      const isOwn = msg.senderId === mySocketId;
      const destructAt = msg.selfDestructMs > 0 ? msg.timestamp + msg.selfDestructMs : undefined;
      const replyTo = (msg as any).replyTo;
      const decrypted: MessageEntry = { ...msg, type: "message" as const, plaintext, isOwn, destructAt, replyTo };
      setEntries((prev) => [...prev, decrypted]);
      if (!isOwn) {
        playChessSound();
        sendNotification(msg.senderName, plaintext);
      }
    } catch (err) {
      console.warn("[Zerra] Failed to decrypt:", err);
    }
  }, []);

  useEffect(() => {
    if (!keyLoaded || !cryptoKey) return;
    const socket = getSocket();
    socket.on("connect", () => { setConnected(true); setSocketId(socket.id!); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("new-message", (msg: EncryptedMessage) => addMessage(msg, cryptoKey, socket.id!));
    socket.on("message-deleted", ({ messageId }: { messageId: string }) => {
      setEntries((prev) => prev.map((e) => e.type === "message" && e.id === messageId ? { ...e, destroyed: true } : e));
    });
    socket.on("new-file", (msg: any) => {
      const isOwn = msg.senderId === socket.id;
      setEntries((prev) => [...prev, { ...msg, type: "file" as const, isOwn }]);
      if (!isOwn) {
        playChessSound();
        sendNotification(msg.senderName, `📎 ${msg.fileName}`);
      }
    });
    socket.on("user-joined", ({ name, participantCount }: any) => {
      addSystem(`${name} joined the room`);
      setRoomMeta((prev) => prev ? { ...prev, participantCount } : null);
    });
    socket.on("user-left", ({ name, participantCount }: any) => {
      addSystem(`${name} left the room`);
socket.on("room-expired", () => {
  alert("This room has expired. You will be redirected.");
  window.location.href = "/";
});
      setRoomMeta((prev) => prev ? { ...prev, participantCount } : null);
    });
    socket.on("peer-typing", ({ name, isTyping }: TypingState) => {
      if (isTyping) {
        setTyping({ name, isTyping });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
      } else {
        setTyping(null);
      }
    });
    return () => {
      socket.off("connect"); socket.off("disconnect"); socket.off("new-message");
      socket.off("message-deleted"); socket.off("new-file");
      socket.off("user-joined"); socket.off("user-left"); socket.off("peer-typing"); socket.off("room-expired");
    };
  }, [keyLoaded, cryptoKey, addMessage, addSystem]);

  useEffect(() => {
    if (!displayName || !connected || !keyLoaded || hasJoined.current) return;
    hasJoined.current = true;
    requestNotificationPermission();
    const socket = getSocket();
    socket.emit("join-room", { roomId, name: displayName }, (res: any) => {
      if (res.error) { setRoomError(res.error); return; }
      setRoomMeta({ roomId, expiresAt: res.expiresAt!, participantCount: res.participantCount! });
      addSystem("You joined the room. Messages are end-to-end encrypted.");
    });
  }, [displayName, connected, keyLoaded, roomId, addSystem]);

  async function handleSend(text: string, selfDestructMs: number, reply?: ReplyTo) {
    if (!cryptoKey || !displayName) return;
    const socket = getSocket();
    if (!socket.connected) {
      setConnected(false);
      return;
    }
    const { encryptedData, iv } = await encryptMessage(text, cryptoKey);
    socket.emit("send-message", {
      encryptedData, iv, selfDestructMs,
      messageId: uuidv4(),
      replyTo: reply || null,
    }, (res: any) => {
      if (res?.error) {
        console.error("[Zerra] Send error:", res.error);
        setConnected(false);
      }
    });
    setReplyTo(null);
  }

  async function handleSendFile(file: File) {
    if (!cryptoKey || !displayName || !roomMeta) return;
    setUploading(true);
    try {
      // Enkriptiraj fajl u browseru
      const { encryptedData, iv } = await encryptFile(file, cryptoKey);

      // Pripremi FormData s enkriptiranim blobom
      const formData = new FormData();
      const encryptedBlob = new Blob([encryptedData], { type: "application/octet-stream" });
      formData.append("file", encryptedBlob, file.name);
      formData.append("roomId", roomMeta.roomId);
      formData.append("fileName", file.name);
      formData.append("fileType", file.type || "application/octet-stream");
      formData.append("iv", iv);

      // Upload na server
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { fileId } = await res.json();

      // Obavijesti ostale korisnike
      getSocket().emit("share-file", {
        fileId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        size: file.size,
        messageId: uuidv4(),
      });
    } catch (err) {
      alert("Failed to upload file. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function handleTyping(isTyping: boolean) {
    getSocket().emit("typing", { isTyping });
  }

  function handleDestroy(messageId: string) {
    getSocket().emit("delete-message", { messageId });
    setEntries((prev) => prev.filter((e) => !(e.type === "message" && e.id === messageId)));
  }

  function handleScrollTo(messageId: string) {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background 0.3s ease";
      el.style.background = "rgba(0,255,198,0.08)";
      setTimeout(() => { el.style.background = ""; }, 1500);
    }
  }

  if (keyError) return <ErrorState message="No encryption key found in the URL." />;
  if (roomError) return <ErrorState message={roomError} />;
  if (!welcomeSeen) return <WelcomeModal onEnter={() => setWelcomeSeen(true)} />;
  if (!displayName) {
    const savedName = sessionStorage.getItem("zerra_name") || "Anonymous";
    setDisplayName(savedName);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B0B0F", position: "relative" }}>
      {/* Grid overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,255,198,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,198,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none" }} />
      {/* Radial glow */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(0,255,198,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.03) 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar roomId={roomId} expiresAt={roomMeta?.expiresAt ?? null} participantCount={roomMeta?.participantCount ?? 0} keyBase64={keyBase64} keyLoaded={keyLoaded} />

      {!connected && keyLoaded && (
        <div style={{ textAlign: "center", padding: "8px 16px", fontSize: "11px", background: "rgba(11,11,15,0.95)", borderBottom: "1px solid rgba(234,179,8,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "var(--font-dm-mono), monospace" }}>
          <span style={{ color: "rgba(234,179,8,0.7)", letterSpacing: "0.08em" }}>[WARN] Connection lost_</span>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "#00FFC6", color: "#0B0B0F", fontSize: "10px", fontWeight: 800, padding: "4px 14px", borderRadius: "6px", border: "none", cursor: "pointer", letterSpacing: "0.08em", fontFamily: "inherit" }}
          >
            RECONNECT
          </button>
        </div>
      )}

      {uploading && (
        <div style={{ textAlign: "center", padding: "8px 16px", fontSize: "11px", background: "rgba(11,11,15,0.95)", borderBottom: "1px solid rgba(0,255,198,0.2)", color: "#00FFC6", fontFamily: "var(--font-dm-mono), monospace", letterSpacing: "0.08em" }}>
          <span style={{ color: "rgba(0,255,198,0.5)" }}>&gt;</span> ENCRYPTING_FILE... <span style={{ opacity: 0.5 }}>AES-256-GCM</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6" id="chat-messages">
        <div className="max-w-3xl mx-auto">
          {entries.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 16px", fontFamily: "var(--font-dm-mono), monospace" }}>
              <div style={{ display: "inline-block", marginBottom: "16px", opacity: 0.4 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 3L29 10v12L16 29 3 22V10L16 3z" stroke="#00FFC6" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M16 3v26M3 10l13 8 13-8" stroke="#00FFC6" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ fontSize: "11px", color: "rgba(0,255,198,0.5)", letterSpacing: "0.1em", margin: "0 0 4px" }}>ROOM_READY</p>
              <p style={{ fontSize: "10px", color: "rgba(156,163,175,0.5)", letterSpacing: "0.06em", margin: 0 }}>Messages encrypted before leaving your device.</p>
            </div>
          )}

          {entries.map((entry) => {
            if (entry.type === "system") return <SystemMessage key={entry.id} text={entry.text} />;
            if (entry.type === "file") return (
              <FileBubble key={entry.id} entry={entry} cryptoKey={cryptoKey!} isOwn={entry.isOwn} />
            );
            if (entry.destroyed) return null;
            return (
              <MessageBubble
                key={entry.id}
                message={entry}
                onDestroy={handleDestroy}
                onReply={setReplyTo}
                onScrollTo={handleScrollTo}
              />
            );
          })}

          {typing && (
            <div className="flex items-center gap-2 mb-2 message-enter">
              <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <span className="text-xs text-text-muted">{typing.name}</span>
                <div className="flex items-end gap-1 h-3">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput
        onSend={handleSend}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
        disabled={!connected || !keyLoaded}
        placeholder={connected ? "Type a message…" : "Connecting…"}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
      </div>
    </div>
  );
}
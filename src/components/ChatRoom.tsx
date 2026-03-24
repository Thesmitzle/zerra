"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  importKeyFromBase64,
  getKeyFromFragment,
  encryptMessage,
  decryptMessage,
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
type ChatEntry = MessageEntry | SystemEntry;

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
    socket.on("user-joined", ({ name, participantCount }: any) => {
      addSystem(`${name} joined the room`);
      setRoomMeta((prev) => prev ? { ...prev, participantCount } : null);
    });
    socket.on("user-left", ({ name, participantCount }: any) => {
      addSystem(`${name} left the room`);
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
      socket.off("message-deleted"); socket.off("user-joined"); socket.off("user-left"); socket.off("peer-typing");
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
    const { encryptedData, iv } = await encryptMessage(text, cryptoKey);
    getSocket().emit("send-message", {
      encryptedData, iv, selfDestructMs,
      messageId: uuidv4(),
      replyTo: reply || null,
    });
    setReplyTo(null);
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
    <div className="min-h-screen flex flex-col mesh-bg noise" style={{ backgroundImage: "radial-gradient(ellipse at 30% 40%, rgba(0,255,198,0.03) 0%, transparent 50%), linear-gradient(#0B0B0F, #0B0B0F)" }}>
      <TopBar roomId={roomId} expiresAt={roomMeta?.expiresAt ?? null} participantCount={roomMeta?.participantCount ?? 0} keyBase64={keyBase64} keyLoaded={keyLoaded} />

      {!connected && keyLoaded && (
        <div style={{ textAlign: "center", padding: "8px", fontSize: "12px", background: "rgba(234,179,8,0.1)", borderBottom: "1px solid rgba(234,179,8,0.2)" }}>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "#00FFC6", color: "#0B0B0F", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "8px", border: "none", cursor: "pointer" }}
          >
            Reconnect
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6" id="chat-messages">
        <div className="max-w-3xl mx-auto">
          {entries.length === 0 && (
            <div className="text-center text-text-muted text-sm py-16">
              <div className="text-3xl mb-3">🔐</div>
              <p className="font-medium text-text-primary mb-1">Room is ready</p>
              <p>Messages are encrypted before leaving your device.</p>
            </div>
          )}

          {entries.map((entry) => {
            if (entry.type === "system") return <SystemMessage key={entry.id} text={entry.text} />;
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
        onTyping={handleTyping}
        disabled={!connected || !keyLoaded}
        placeholder={connected ? "Type a message…" : "Connecting…"}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
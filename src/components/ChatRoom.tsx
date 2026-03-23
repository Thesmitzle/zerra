"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { MessageInput } from "./MessageInput";
import { WelcomeModal } from "./WelcomeModal";
import { usePrivacy } from "@/hooks/usePrivacy";
import type {
  EncryptedMessage,
  DecryptedMessage,
  RoomMeta,
  TypingState,
} from "@/types";

type SystemEntry = {
  type: "system";
  id: string;
  text: string;
};

type MessageEntry = DecryptedMessage & { type: "message" };

type ChatEntry = MessageEntry | SystemEntry;

interface ChatRoomProps {
  roomId: string;
}

// ── Name setup modal ──────────────────────────────────────────────────────────
function NameModal({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [name, setName] = useState(
    typeof window !== "undefined"
      ? sessionStorage.getItem("zerra_name") || ""
      : ""
  );

  return (
    <div className="fixed inset-0 bg-bg/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass accent-border rounded-2xl p-8 w-full max-w-sm animate-pop-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-glow mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 1.5L16.5 5.25V12.75L9 16.5L1.5 12.75V5.25L9 1.5Z"
                stroke="#0B0B0F"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="9" r="2.5" fill="#0B0B0F" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Entering secure room
          </h2>
          <p className="text-sm text-text-muted">
            Set your display name to continue.
            <br />
            No account needed.
          </p>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && onConfirm(name.trim() || "Anonymous")
          }
          placeholder="Anonymous"
          maxLength={24}
          autoFocus
          className="zerra-input w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm mb-4 transition-all duration-200"
          style={{ fontFamily: "var(--font-outfit)" }}
        />

        <button
          onClick={() => onConfirm(name.trim() || "Anonymous")}
          className="btn-press w-full bg-accent text-bg font-bold py-3 rounded-xl text-sm transition-all duration-200 hover:shadow-glow"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Enter Room
        </button>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <div className="text-4xl">🔒</div>
      <h2
        className="text-xl font-bold"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Room unavailable
      </h2>
      <p className="text-text-muted text-sm max-w-xs">{message}</p>
      <button
        onClick={() => router.push("/")}
        className="btn-press bg-accent text-bg font-semibold px-6 py-2.5 rounded-xl text-sm hover:shadow-glow transition-all"
      >
        Create a new room
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasJoined = useRef(false);

  // ── Load encryption key from fragment ─────────────────────────────────────
  useEffect(() => {
    const raw = getKeyFromFragment();
    if (!raw) {
      setKeyError(true);
      return;
    }
    setKeyBase64(raw);
    importKeyFromBase64(raw)
      .then((key) => {
        setCryptoKey(key);
        setKeyLoaded(true);
      })
      .catch(() => setKeyError(true));
  }, []);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, typing]);

  // ── Add system message ─────────────────────────────────────────────────────
  const addSystem = useCallback((text: string) => {
    setEntries((prev) => [
      ...prev,
      { type: "system" as const, id: uuidv4(), text },
    ]);
  }, []);

  // ── Decrypt and add message ────────────────────────────────────────────────
  const addMessage = useCallback(
    async (msg: EncryptedMessage, key: CryptoKey, mySocketId: string) => {
      try {
        const plaintext = await decryptMessage(
          { encryptedData: msg.encryptedData, iv: msg.iv },
          key
        );
        const isOwn = msg.senderId === mySocketId;
        const destructAt =
          msg.selfDestructMs > 0
            ? msg.timestamp + msg.selfDestructMs
            : undefined;

        const decrypted: MessageEntry = {
          ...msg,
          type: "message" as const,
          plaintext,
          isOwn,
          destructAt,
        };

        setEntries((prev) => [...prev, decrypted]);
      } catch (err) {
        console.warn("[Zerra] Failed to decrypt message:", err);
      }
    },
    []
  );

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!keyLoaded || !cryptoKey) return;

    const socket = getSocket();

    socket.on("connect", () => {
      setConnected(true);
      setSocketId(socket.id!);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("new-message", (msg: EncryptedMessage) => {
      addMessage(msg, cryptoKey, socket.id!);
    });

    socket.on("message-deleted", ({ messageId }: { messageId: string }) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.type === "message" && e.id === messageId
            ? { ...e, destroyed: true }
            : e
        )
      );
    });

    socket.on("user-joined", ({ name, participantCount }: { name: string; participantCount: number }) => {
      addSystem(`${name} joined the room`);
      setRoomMeta((prev) => prev ? { ...prev, participantCount } : null);
    });

    socket.on("user-left", ({ name, participantCount }: { name: string; participantCount: number }) => {
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
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new-message");
      socket.off("message-deleted");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("peer-typing");
    };
  }, [keyLoaded, cryptoKey, addMessage, addSystem]);

  // ── Join room after name is set ────────────────────────────────────────────
  useEffect(() => {
    if (!displayName || !connected || !keyLoaded || hasJoined.current) return;
    hasJoined.current = true;

    const socket = getSocket();
    socket.emit(
      "join-room",
      { roomId, name: displayName },
      (res: { success?: boolean; error?: string; expiresAt?: number; participantCount?: number }) => {
        if (res.error) {
          setRoomError(res.error);
          return;
        }
        setRoomMeta({
          roomId,
          expiresAt: res.expiresAt!,
          participantCount: res.participantCount!,
        });
        addSystem("You joined the room. Messages are end-to-end encrypted.");
      }
    );
  }, [displayName, connected, keyLoaded, roomId, addSystem]);

  // ── Send message ───────────────────────────────────────────────────────────
  async function handleSend(text: string, selfDestructMs: number) {
    if (!cryptoKey || !displayName) return;

    const { encryptedData, iv } = await encryptMessage(text, cryptoKey);
    const socket = getSocket();

    socket.emit("send-message", {
      encryptedData,
      iv,
      selfDestructMs,
      messageId: uuidv4(),
    });
  }

  // ── Typing indicator ───────────────────────────────────────────────────────
  function handleTyping(isTyping: boolean) {
    getSocket().emit("typing", { isTyping });
  }

  // ── Destroy message (from self-destruct timer) ─────────────────────────────
  function handleDestroy(messageId: string) {
    getSocket().emit("delete-message", { messageId });
    setEntries((prev) =>
      prev.filter(
        (e) => !(e.type === "message" && e.id === messageId)
      )
    );
  }

  // ── Error states ───────────────────────────────────────────────────────────
  if (keyError) {
    return (
      <ErrorState message="No encryption key found in the URL. Make sure you used the full link including the #key= part." />
    );
  }

  if (roomError) {
    return <ErrorState message={roomError} />;
  }

  // ── Show welcome modal first, then name modal ─────────────────────────────
  if (!welcomeSeen) {
    return <WelcomeModal onEnter={() => setWelcomeSeen(true)} />;
  }

  // ── Name modal ─────────────────────────────────────────────────────────────
  if (!displayName) {
    return (
      <NameModal
        onConfirm={(name) => {
          sessionStorage.setItem("zerra_name", name);
          setDisplayName(name);
        }}
      />
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col mesh-bg noise"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 30% 40%, rgba(0,255,198,0.03) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 50%), linear-gradient(#0B0B0F, #0B0B0F)",
      }}
    >
      <TopBar
        roomId={roomId}
        expiresAt={roomMeta?.expiresAt ?? null}
        participantCount={roomMeta?.participantCount ?? 0}
        keyBase64={keyBase64}
        keyLoaded={keyLoaded}
      />

      {/* Connection banner */}
      {!connected && keyLoaded && (
        <div className="text-center py-2 text-xs text-yellow-400 bg-yellow-400/10 border-b border-yellow-400/20">
          ⚠ Reconnecting…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {entries.length === 0 && (
            <div className="text-center text-text-muted text-sm py-16">
              <div className="text-3xl mb-3">🔐</div>
              <p className="font-medium text-text-primary mb-1">
                Room is ready
              </p>
              <p>Messages are encrypted before leaving your device.</p>
            </div>
          )}

          {entries.map((entry) => {
            if (entry.type === "system") {
              return <SystemMessage key={entry.id} text={entry.text} />;
            }
            if (entry.destroyed) return null;
            return (
              <MessageBubble
                key={entry.id}
                message={entry}
                onDestroy={handleDestroy}
              />
            );
          })}

          {/* Typing indicator */}
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

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!connected || !keyLoaded}
        placeholder={connected ? "Type a message…" : "Connecting…"}
      />
    </div>
  );
}

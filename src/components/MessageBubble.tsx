"use client";

import { useState, useEffect, useRef } from "react";
import type { DecryptedMessage } from "@/types";

interface MessageBubbleProps {
  message: DecryptedMessage;
  onDestroy: (id: string) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  return `${m}m`;
}

export function MessageBubble({ message, onDestroy }: MessageBubbleProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [destroying, setDestroying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const destroyRef = useRef<NodeJS.Timeout | null>(null);

  const isOwn = message.isOwn;

  useEffect(() => {
    if (!message.destructAt || message.selfDestructMs === 0) return;

    const tick = () => {
      const left = message.destructAt! - Date.now();
      if (left <= 0) {
        setDestroying(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        destroyRef.current = setTimeout(() => {
          onDestroy(message.id);
        }, 500);
      } else {
        setTimeLeft(left);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (destroyRef.current) clearTimeout(destroyRef.current);
    };
  }, [message.destructAt, message.selfDestructMs, message.id, onDestroy]);

  if (message.destroyed) return null;

  const isUrgent = timeLeft !== null && timeLeft < 5000;

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 message-enter ${
        destroying ? "message-destroy" : ""
      }`}
    >
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>
        {/* Sender name */}
        
          <span className="text-xs text-text-muted ml-1 mb-1 font-medium">
            {isOwn ? "Ti" : message.senderName}
          </span>
        )}

        <div className="relative group">
          {/* Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-150 ${
              isOwn
                ? "bg-accent text-bg rounded-tr-sm shadow-glow"
                : "bg-surface-2 text-text-primary border border-border rounded-tl-sm"
            } ${isOwn ? "hover:shadow-glow-strong" : "hover:border-white/10"}`}
          >
            {/* Message text */}
            <p className="whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-outfit)" }}>
              {message.plaintext}
            </p>

            {/* Footer row */}
            <div
              className={`flex items-center gap-2 mt-1.5 ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {/* Timestamp */}
              <span
                className={`text-[10px] ${
                  isOwn ? "text-bg/60" : "text-text-muted"
                }`}
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {formatTime(message.timestamp)}
              </span>

              {/* Self-destruct countdown */}
              {timeLeft !== null && (
                <span
                  className={`flex items-center gap-1 text-[10px] font-medium ${
                    isOwn ? "text-bg/70" : "text-text-muted"
                  } ${isUrgent ? "countdown-urgent" : ""}`}
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M4.5 1.5A3 3 0 1 0 7.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4.5 3V4.5L5.5 5.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {formatCountdown(timeLeft)}
                </span>
              )}

              {/* Lock icon for own messages */}
              {isOwn && (
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  className="opacity-50"
                >
                  <rect x="1" y="4" width="7" height="4.5" rx="1" stroke="#0B0B0F" strokeWidth="1.2" />
                  <path
                    d="M2.5 4V3a2 2 0 0 1 4 0v1"
                    stroke="#0B0B0F"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Destroy indicator overlay */}
          {destroying && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-bg/80 backdrop-blur-sm">
              <span className="text-xs text-text-muted">💨 Destroyed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// System message (join/leave/info)
export function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-4 message-enter">
      <span className="text-xs text-text-muted bg-surface-2 border border-border rounded-full px-3 py-1">
        {text}
      </span>
    </div>
  );
}

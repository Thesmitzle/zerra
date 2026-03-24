"use client";

import { useState, useEffect, useRef } from "react";
import type { DecryptedMessage } from "@/types";

export interface ReplyTo {
  id: string;
  senderName: string;
  plaintext: string;
}

interface MessageBubbleProps {
  message: DecryptedMessage;
  onDestroy: (id: string) => void;
  onReply: (reply: ReplyTo) => void;
  onScrollTo: (id: string) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.ceil(s / 60)}m`;
}

export function MessageBubble({ message, onDestroy, onReply, onScrollTo }: MessageBubbleProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [destroying, setDestroying] = useState(false);
  const [copied, setCopied] = useState(false);
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
        destroyRef.current = setTimeout(() => onDestroy(message.id), 500);
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

  function handleCopy() {
    navigator.clipboard.writeText(message.plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (message.destroyed) return null;

  const isUrgent = timeLeft !== null && timeLeft < 5000;
  const replyData = (message as any).replyTo;

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 message-enter ${destroying ? "message-destroy" : ""}`}
    >
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>

        {/* Sender name */}
        <span className="text-xs text-text-muted ml-1 mb-1 font-medium">
          {isOwn ? "Ti" : message.senderName}
        </span>

        <div className="relative group">
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-150 ${
              isOwn
                ? "bg-accent text-bg rounded-tr-sm shadow-glow"
                : "bg-surface-2 text-text-primary border border-border rounded-tl-sm"
            }`}
          >
            {/* Reply preview */}
            {replyData && (
              <div
                onClick={() => onScrollTo(replyData.id)}
                className={`flex items-start gap-2 mb-2 pb-2 cursor-pointer rounded-lg px-2 py-1.5 ${
                  isOwn ? "bg-bg/20" : "bg-surface-2/80"
                } border-l-2 border-accent/60`}
              >
                <div className="min-w-0">
                  <p className={`text-xs font-semibold mb-0.5 ${isOwn ? "text-bg/70" : "text-accent"}`}>
                    {replyData.senderName}
                  </p>
                  <p className={`text-xs truncate ${isOwn ? "text-bg/60" : "text-text-muted"}`}>
                    {replyData.plaintext}
                  </p>
                </div>
              </div>
            )}

            {/* Message text */}
            <p className="whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-outfit)" }}>
              {message.plaintext}
            </p>

            {/* Footer */}
            <div className={`flex items-center gap-2 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
              <span className={`text-[10px] ${isOwn ? "text-bg/60" : "text-text-muted"}`} style={{ fontFamily: "var(--font-dm-mono)" }}>
                {formatTime(message.timestamp)}
              </span>
              {timeLeft !== null && (
                <span className={`flex items-center gap-1 text-[10px] font-medium ${isOwn ? "text-bg/70" : "text-text-muted"} ${isUrgent ? "countdown-urgent" : ""}`}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M4.5 1.5A3 3 0 1 0 7.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M4.5 3V4.5L5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {formatCountdown(timeLeft)}
                </span>
              )}
              {isOwn && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="opacity-50">
                  <rect x="1" y="4" width="7" height="4.5" rx="1" stroke="#0B0B0F" strokeWidth="1.2" />
                  <path d="M2.5 4V3a2 2 0 0 1 4 0v1" stroke="#0B0B0F" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Action buttons — na hover */}
          <div className={`absolute ${isOwn ? "right-full mr-1" : "left-full ml-1"} top-2 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-1`}>
            {/* Reply */}
            <button
              onClick={() => onReply({ id: message.id, senderName: isOwn ? "Ti" : message.senderName, plaintext: message.plaintext })}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-accent transition-colors"
              style={{ background: "rgba(18,18,26,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Reply"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M4 2L1 5l3 3M1 5h6a3 3 0 0 1 3 3v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              style={{ background: "rgba(18,18,26,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Kopiraj"
            >
              {copied ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1" stroke="#9CA3AF" strokeWidth="1.2" />
                  <path d="M7 3V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          {/* Destroy overlay */}
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

export function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-4 message-enter">
      <span className="text-xs text-text-muted bg-surface-2 border border-border rounded-full px-3 py-1">
        {text}
      </span>
    </div>
  );
}
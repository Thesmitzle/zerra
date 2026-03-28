"use client";

import { useEffect, useRef, useState } from "react";
import type { DecryptedMessage } from "@/types";

export interface ReplyTo {
  id: string;
  senderName: string;
  plaintext: string;
}

interface MessageBubbleProps {
  message: DecryptedMessage & { replyTo?: ReplyTo };
  onDestroy: (id: string) => void;
  onReply: (reply: ReplyTo) => void;
  onScrollTo: (id: string) => void;
}

export function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-3">
      <span style={{ fontSize: "10px", color: "rgba(0,255,198,0.35)", fontFamily: "monospace", background: "rgba(0,255,198,0.04)", border: "1px solid rgba(0,255,198,0.08)", borderRadius: "20px", padding: "3px 12px", letterSpacing: "0.05em" }}>
        {text}
      </span>
    </div>
  );
}

export function MessageBubble({ message, onDestroy, onReply, onScrollTo }: MessageBubbleProps) {
  const { id, plaintext, isOwn, senderName, timestamp, destructAt, replyTo } = message;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [destroyed, setDestroyed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!destructAt) return;
    const update = () => {
      const left = destructAt - Date.now();
      if (left <= 0) {
        setDestroyed(true);
        onDestroy(id);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setTimeLeft(left);
      }
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [destructAt, id, onDestroy]);

  if (destroyed) return null;

  function formatCountdown(ms: number) {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.ceil(s / 60)}m`;
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function handleCopy() {
    navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      id={`msg-${id}`}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", gap: "2px" }}>

        {/* Sender name */}
        {!isOwn && (
          <span style={{ fontSize: "10px", color: "rgba(0,255,198,0.6)", fontFamily: "monospace", paddingLeft: "4px", letterSpacing: "0.05em" }}>
            {senderName}
          </span>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div
            onClick={() => onScrollTo(replyTo.id)}
            style={{ cursor: "pointer", background: isOwn ? "rgba(0,0,0,0.2)" : "rgba(0,255,198,0.04)", border: `1px solid ${isOwn ? "rgba(255,255,255,0.08)" : "rgba(0,255,198,0.1)"}`, borderRadius: "8px", padding: "5px 8px", marginBottom: "2px", maxWidth: "100%" }}
          >
            <p style={{ fontSize: "9px", color: "#00FFC6", fontFamily: "monospace", margin: "0 0 2px" }}>{replyTo.senderName}</p>
            <p style={{ fontSize: "10px", color: "#9CA3AF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{replyTo.plaintext}</p>
          </div>
        )}

        {/* Bubble + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexDirection: isOwn ? "row-reverse" : "row" }}>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "4px", opacity: hovered ? 1 : 0, transition: "opacity 0.15s", flexDirection: isOwn ? "row-reverse" : "row" }}>
            <button
              onClick={() => onReply({ id, senderName, plaintext })}
              style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(0,255,198,0.08)", border: "1px solid rgba(0,255,198,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", transition: "all 0.15s" }}
              title="Reply"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M1 4.5h7a3 3 0 0 1 0 6H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.5 2L1 4.5 3.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={handleCopy}
              style={{ width: "24px", height: "24px", borderRadius: "6px", background: copied ? "rgba(0,255,198,0.15)" : "rgba(0,255,198,0.08)", border: "1px solid rgba(0,255,198,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: copied ? "#00FFC6" : "#9CA3AF", transition: "all 0.15s" }}
              title="Copy"
            >
              {copied ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#00FFC6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Main bubble */}
          <div style={{
            background: isOwn
              ? "linear-gradient(135deg, rgba(0,255,198,0.15), rgba(0,255,198,0.08))"
              : "rgba(255,255,255,0.04)",
            border: isOwn
              ? "1px solid rgba(0,255,198,0.25)"
              : "1px solid rgba(255,255,255,0.07)",
            borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            padding: "8px 12px",
            backdropFilter: "blur(10px)",
            position: "relative",
            boxShadow: isOwn ? "0 0 20px rgba(0,255,198,0.06)" : "none",
          }}>
            {/* Self-destruct timer badge */}
            {timeLeft !== null && (
              <div style={{ position: "absolute", top: "-8px", right: isOwn ? "auto" : "-4px", left: isOwn ? "-4px" : "auto", background: "#EF4444", borderRadius: "20px", padding: "1px 6px", fontSize: "8px", fontFamily: "monospace", color: "#fff", fontWeight: 700 }}>
                💣 {formatCountdown(timeLeft)}
              </div>
            )}

            {/* Message text */}
            <p style={{ fontSize: "13px", color: isOwn ? "#E5E7EB" : "#D1D5DB", margin: 0, lineHeight: 1.5, wordBreak: "break-word", fontFamily: "var(--font-outfit)" }}>
              {plaintext}
            </p>

            {/* Timestamp + lock */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", marginTop: "4px" }}>
              <span style={{ fontSize: "9px", color: isOwn ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                {formatTime(timestamp)}
              </span>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <rect x="1.5" y="4" width="7" height="5" rx="1" stroke={isOwn ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.25)"} strokeWidth="1.2"/>
                <path d="M3 4V3a2 2 0 0 1 4 0v1" stroke={isOwn ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.25)"} strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

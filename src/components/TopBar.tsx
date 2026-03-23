"use client";

import { useState, useEffect } from "react";
import { generateKeyFingerprint } from "@/lib/crypto";

interface TopBarProps {
  roomId: string;
  expiresAt: number | null;
  participantCount: number;
  keyBase64: string | null;
  keyLoaded: boolean;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function TopBar({
  roomId,
  expiresAt,
  participantCount,
  keyBase64,
  keyLoaded,
}: TopBarProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [copied, setCopied] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const left = expiresAt - Date.now();
      setTimeLeft(formatTimeLeft(left));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Key fingerprint
  useEffect(() => {
    if (!keyBase64) return;
    generateKeyFingerprint(keyBase64).then(setFingerprint);
  }, [keyBase64]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isUrgent = expiresAt && expiresAt - Date.now() < 5 * 60 * 1000;

  return (
    <header className="glass border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Logo + room info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-glow flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 1.5L16.5 5.25V12.75L9 16.5L1.5 12.75V5.25L9 1.5Z"
                stroke="#0B0B0F"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="9" r="2.5" fill="#0B0B0F" />
            </svg>
          </div>
          <span
            className="font-bold text-base text-text-primary"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Zerra
          </span>
        </div>

        <span className="text-border text-lg select-none">·</span>

        {/* Room ID */}
        <span
          className="text-xs text-text-muted font-mono hidden sm:block"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          {roomId}
        </span>
      </div>

      {/* Center: E2E indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-glow animate-pulse flex-shrink-0" />
          <span className="text-xs font-medium text-accent hidden sm:block">
            End-to-end encrypted
          </span>
          <span className="text-xs font-medium text-accent sm:hidden">E2E</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Participants */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="4.5" cy="3" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 10c0-1.933 1.567-3.5 3.5-3.5S8 8.067 8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="8.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8.5 7c1.105 0 2 .895 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{participantCount}</span>
        </div>

        {/* Expiry */}
        {timeLeft && (
          <div
            className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border ${
              isUrgent
                ? "text-red-400 border-red-500/30 bg-red-500/10"
                : "text-text-muted border-border bg-surface-2"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 2.5V5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className={isUrgent ? "countdown-urgent" : ""}>{timeLeft}</span>
          </div>
        )}

        {/* Fingerprint */}
        {fingerprint && (
          <button
            onClick={() => setShowFingerprint(!showFingerprint)}
            className="relative text-text-muted hover:text-text-primary transition-colors"
            title="Key fingerprint"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5C4 1.5 1.5 4 1.5 7c0 .5.06 1 .17 1.46M7 1.5c3 0 5.5 2.5 5.5 5.5 0 .5-.06 1-.17 1.46M7 1.5V7m0 5.5V7m0 0H1.5m5.5 0H12.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {showFingerprint && (
              <div
                className="absolute top-6 right-0 glass border border-border rounded-xl p-3 text-xs whitespace-nowrap z-30"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                <div className="text-text-muted mb-1">Key fingerprint</div>
                <div className="text-accent">{fingerprint}</div>
              </div>
            )}
          </button>
        )}

        {/* Copy link */}
        <button
          onClick={copyLink}
          className="btn-press flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-text-muted hover:text-text-primary hover:border-accent/30 transition-all duration-150"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-accent hidden sm:block">Copied!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:block">Share</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

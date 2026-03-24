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
  return `${h}h ${m % 60}m`;
}

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=12121A&color=00FFC6&qzone=2`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,11,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass border border-border rounded-2xl p-6 flex flex-col items-center gap-4"
        style={{ maxWidth: "280px", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="font-bold text-text-primary mb-1" style={{ fontFamily: "var(--font-syne)" }}>
            Scan to join
          </p>
          <p className="text-xs text-text-muted">Podijeli QR kod za ulaz u sobu</p>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "2px solid rgba(0,255,198,0.2)" }}>
          <img src={qrUrl} alt="QR kod" width={200} height={200} />
        </div>

        <p className="text-xs text-text-muted text-center break-all px-2" style={{ fontFamily: "var(--font-dm-mono)", fontSize: "9px" }}>
          {url.slice(0, 50)}...
        </p>

        <button
          onClick={onClose}
          className="btn-press w-full py-2.5 rounded-xl text-sm font-semibold text-bg transition-all"
          style={{ background: "#00FFC6" }}
        >
          Zatvori
        </button>
      </div>
    </div>
  );
}

export function TopBar({ roomId, expiresAt, participantCount, keyBase64, keyLoaded }: TopBarProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

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
    <>
      {showQR && <QRModal url={currentUrl} onClose={() => setShowQR(false)} />}

      <header className="glass border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-glow flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L16.5 5.25V12.75L9 16.5L1.5 12.75V5.25L9 1.5Z" stroke="#0B0B0F" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="9" cy="9" r="2.5" fill="#0B0B0F" />
              </svg>
            </div>
            <span className="font-bold text-base text-text-primary" style={{ fontFamily: "var(--font-syne)" }}>Zerra</span>
          </div>
          <span className="text-border text-lg select-none">·</span>
          <span className="text-xs text-text-muted font-mono hidden sm:block" style={{ fontFamily: "var(--font-dm-mono)" }}>
            {roomId}
          </span>
        </div>

        {/* Center: E2E indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-glow animate-pulse flex-shrink-0" />
            <span className="text-xs font-medium text-accent hidden sm:block">End-to-end encrypted</span>
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
            <div className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border ${isUrgent ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-text-muted border-border bg-surface-2"}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 2.5V5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className={isUrgent ? "countdown-urgent" : ""}>{timeLeft}</span>
            </div>
          )}

          {/* QR kod */}
          <button
            onClick={() => setShowQR(true)}
            className="btn-press flex items-center gap-1.5 text-xs bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-text-muted hover:text-accent hover:border-accent/30 transition-all duration-150"
            title="QR kod"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="2.5" y="2.5" width="2" height="2" fill="currentColor" />
              <rect x="9.5" y="2.5" width="2" height="2" fill="currentColor" />
              <rect x="2.5" y="9.5" width="2" height="2" fill="currentColor" />
              <path d="M8 8h2v2H8zM10 10h3M10 8h3v2M8 10v3M8 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:block">QR</span>
          </button>

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
    </>
  );
}
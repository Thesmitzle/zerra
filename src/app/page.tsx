"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateEncryptionKey,
  exportKeyToBase64,
} from "@/lib/crypto";
import type { RoomExpiry } from "@/types";

const EXPIRY_OPTIONS: { value: RoomExpiry; label: string; desc: string }[] = [
  { value: "1h", label: "1 hour", desc: "Quick sessions" },
  { value: "24h", label: "24 hours", desc: "Day-long conversations" },
  { value: "7d", label: "7 days", desc: "Extended projects" },
];

export default function LandingPage() {
  const router = useRouter();
  const [expiry, setExpiry] = useState<RoomExpiry>("24h");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  async function createRoom() {
    if (loading) return;
    setLoading(true);

    try {
      // Generate E2E key client-side
      const key = await generateEncryptionKey();
      const keyBase64 = await exportKeyToBase64(key);

      // Create room on server
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiry }),
      });

      if (!res.ok) throw new Error("Failed to create room");
      const { roomId } = await res.json();

      // Store display name in sessionStorage
      if (name.trim()) {
        sessionStorage.setItem("zerra_name", name.trim());
      }

      // Navigate — key in fragment, never sent to server
      router.push(`/room/${roomId}#key=${encodeURIComponent(keyBase64)}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <main className="mesh-bg noise min-h-screen flex flex-col items-center justify-center px-4">
      {/* Grid lines decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16 justify-center">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-glow">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
            className="text-2xl font-bold tracking-tight text-text-primary"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Zerra
          </span>
        </div>

        {/* Hero text */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-extrabold leading-tight mb-4"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Chat without{" "}
            <span className="glow-text">leaving traces</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed max-w-md mx-auto">
            End-to-end encrypted. Zero knowledge. Self-destructing messages.{" "}
            <span className="text-text-primary">The server never sees your words.</span>
          </p>
        </div>

        {/* Create room card */}
        <div className="glass rounded-2xl p-6 accent-border mb-6">
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">
            Create a private room
          </p>

          {/* Name input */}
          <div className="mb-4">
            <label className="block text-sm text-text-muted mb-2">Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous"
              maxLength={24}
              className="zerra-input w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm transition-all duration-200"
              style={{ fontFamily: "var(--font-outfit)" }}
            />
          </div>

          {/* Expiry selector */}
          <div className="mb-6">
            <label className="block text-sm text-text-muted mb-2">Room expires after</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExpiry(opt.value)}
                  className={`btn-press rounded-xl px-3 py-3 text-sm font-medium transition-all duration-150 text-center ${
                    expiry === opt.value
                      ? "bg-accent text-bg shadow-glow"
                      : "bg-surface-2 text-text-muted hover:text-text-primary border border-border"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={createRoom}
            disabled={loading}
            className="btn-press w-full bg-accent text-bg font-bold py-3.5 rounded-xl text-sm transition-all duration-200 hover:shadow-glow-strong disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {loading ? (
              <>
                <Spinner />
                Generating key…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create Encrypted Room
              </>
            )}
          </button>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {[
            { icon: "🔑", label: "AES-256-GCM", sub: "Encryption" },
            { icon: "👁️", label: "Zero knowledge", sub: "Server blind" },
            { icon: "💣", label: "Self-destruct", sub: "Auto-delete" },
          ].map((item) => (
            <div
              key={item.label}
              className="glass rounded-xl p-3 text-center border border-border"
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-xs font-semibold text-text-primary">{item.label}</div>
              <div className="text-xs text-text-muted">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block shadow-glow" />
            Open source · No accounts · No logs
          </span>
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path
        d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

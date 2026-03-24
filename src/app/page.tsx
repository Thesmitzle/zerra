"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  generateEncryptionKey,
  exportKeyToBase64,
} from "@/lib/crypto";
import type { RoomExpiry } from "@/types";

const EXPIRY_OPTIONS: { value: RoomExpiry; label: string; desc: string }[] = [
  { value: "15m", label: "15 min", desc: "Quick chat" },
  { value: "30m", label: "30 min", desc: "Short session" },
  { value: "1h", label: "1 hour", desc: "Standard" },
];

export default function LandingPage() {
  const router = useRouter();
  const [expiry, setExpiry] = useState<RoomExpiry>("30m");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [muted, setMuted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Check if already verified in session
    if (sessionStorage.getItem("zerra_verified") === "true") {
      setCodeVerified(true);
    }
    if (audioRef.current) {
      audioRef.current.volume = 0.12;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  function toggleMute() {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setMuted((prev) => !prev);
    }
  }

  async function verifyCode() {
    if (!accessCode.trim() || verifying) return;
    setVerifying(true);
    setCodeError(false);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      if (res.ok) {
        sessionStorage.setItem("zerra_verified", "true");
        setCodeVerified(true);
      } else {
        setCodeError(true);
      }
    } catch {
      setCodeError(true);
    } finally {
      setVerifying(false);
    }
  }

  async function createRoom() {
    if (loading) return;
    setLoading(true);
    try {
      const key = await generateEncryptionKey();
      const keyBase64 = await exportKeyToBase64(key);
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiry }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      const { roomId } = await res.json();
      if (name.trim()) sessionStorage.setItem("zerra_name", name.trim());
      router.push(`/room/${roomId}#key=${encodeURIComponent(keyBase64)}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", position: "relative", overflow: "hidden", background: "#0B0B0F" }}>

      {/* Audio */}
      <audio ref={audioRef} src="/ambient.mp3" loop preload="auto" />

      {/* Mute gumb */}
      <button
        onClick={toggleMute}
        title={muted ? "Unmute" : "Mute"}
        style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 50, width: "36px", height: "36px", borderRadius: "50%", background: "rgba(18,18,26,0.9)", border: "1px solid rgba(0,255,198,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="23" y1="9" x2="17" y2="15" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="17" y1="9" x2="23" y2="15" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Pozadina */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <img alt="" src="/zerra-mascot.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%", filter: "brightness(0.25) saturate(0.8)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(11,11,15,0.5) 0%, rgba(11,11,15,0.3) 40%, rgba(11,11,15,0.85) 80%, rgba(11,11,15,1) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,255,198,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "400px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.15, margin: "0 0 8px", letterSpacing: "-0.02em", fontFamily: "var(--font-syne)" }}>
            <span style={{ color: "#E5E7EB" }}>Chat without</span>
            <br />
            <span style={{ color: "#00FFC6", textShadow: "0 0 30px rgba(0,255,198,0.4)" }}>leaving traces</span>
          </h1>
          <p style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-outfit)" }}>
            End-to-end encrypted. Zero knowledge.{" "}
            <span style={{ color: "#E5E7EB" }}>The server never sees your words.</span>
          </p>
        </div>

        {/* Access code gate */}
        {!codeVerified ? (
          <div style={{ background: "rgba(18,18,26,0.85)", border: "1px solid rgba(0,255,198,0.15)", borderRadius: "16px", padding: "20px", backdropFilter: "blur(12px)", marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 16px" }}>
              🔐 Access Required
            </p>
            <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "14px", lineHeight: 1.5 }}>
              Zerra is invite-only. Enter your access code to continue.
            </p>
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value.toUpperCase()); setCodeError(false); }}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={20}
                autoFocus
                style={{ width: "100%", background: "rgba(26,26,38,0.9)", border: `1px solid ${codeError ? "#EF4444" : "rgba(255,255,255,0.06)"}`, borderRadius: "10px", padding: "10px 14px", color: "#E5E7EB", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", letterSpacing: "0.1em", textAlign: "center" }}
              />
              {codeError && (
                <p style={{ fontSize: "11px", color: "#EF4444", marginTop: "6px", textAlign: "center" }}>
                  Invalid access code. Please try again.
                </p>
              )}
            </div>
            <button
              onClick={verifyCode}
              disabled={verifying || !accessCode.trim()}
              style={{ width: "100%", padding: "12px", background: "#00FFC6", color: "#0B0B0F", fontSize: "13px", fontWeight: 800, border: "none", borderRadius: "12px", cursor: verifying ? "not-allowed" : "pointer", opacity: verifying || !accessCode.trim() ? 0.6 : 1, fontFamily: "var(--font-syne)" }}
            >
              {verifying ? "Verifying…" : "Enter Zerra"}
            </button>
          </div>
        ) : (
          /* Main card — prikaže se nakon verifikacije */
          <div style={{ background: "rgba(18,18,26,0.85)", border: "1px solid rgba(0,255,198,0.15)", borderRadius: "16px", padding: "20px", backdropFilter: "blur(12px)", marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 16px" }}>Create a private room</p>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#9CA3AF", marginBottom: "6px" }}>Your name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                maxLength={24}
                style={{ width: "100%", background: "rgba(26,26,38,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 14px", color: "#E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-outfit)" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#9CA3AF", marginBottom: "6px" }}>Room expires after</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    style={{ padding: "8px 4px", borderRadius: "10px", border: "1px solid", borderColor: expiry === opt.value ? "#00FFC6" : "rgba(255,255,255,0.06)", background: expiry === opt.value ? "#00FFC6" : "rgba(26,26,38,0.9)", color: expiry === opt.value ? "#0B0B0F" : "#9CA3AF", cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontFamily: "var(--font-outfit)" }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "1px" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={createRoom}
              disabled={loading}
              style={{ width: "100%", padding: "12px", background: "#00FFC6", color: "#0B0B0F", fontSize: "13px", fontWeight: 800, border: "none", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 0 20px rgba(0,255,198,0.2)", fontFamily: "var(--font-syne)" }}
            >
              {loading ? "Generating key…" : (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Create Encrypted Room
                </>
              )}
            </button>
          </div>
        )}

        {/* Trust pills */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "16px" }}>
          {[
            { icon: "🔑", label: "AES-256-GCM", sub: "Encryption" },
            { icon: "👁️", label: "Zero knowledge", sub: "Server blind" },
            { icon: "💣", label: "Self-destruct", sub: "Auto-delete" },
          ].map((item) => (
            <div key={item.label} style={{ background: "rgba(18,18,26,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "8px 4px", textAlign: "center", backdropFilter: "blur(8px)" }}>
              <div style={{ fontSize: "14px", marginBottom: "3px" }}>{item.icon}</div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#E5E7EB" }}>{item.label}</div>
              <div style={{ fontSize: "8px", color: "#9CA3AF", marginTop: "1px" }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#9CA3AF", opacity: 0.5, fontFamily: "var(--font-outfit)" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#00FFC6", boxShadow: "0 0 6px rgba(0,255,198,0.8)", flexShrink: 0 }} />
            <span>Invite only · No accounts · No logs ·</span>
            <svg width="14" height="14" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
              <defs>
                <linearGradient id="fhg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFC6" />
                  <stop offset="100%" stopColor="#00B894" />
                </linearGradient>
              </defs>
              <polygon points="24,2 42,12 42,36 24,46 6,36 6,12" fill="none" stroke="url(#fhg)" strokeWidth="2" />
              <circle cx="24" cy="21" r="6" fill="none" stroke="#00FFC6" strokeWidth="2" />
              <rect x="21" y="24" width="6" height="7" rx="1" fill="#00FFC6" />
              <circle cx="24" cy="21" r="2" fill="#00FFC6" />
            </svg>
            <span style={{ color: "#E5E7EB", fontWeight: 600 }}>Created by AlphaGe3k</span>
            <span style={{ color: "#9CA3AF" }}>·</span>
            <a href="/zerra-about.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#00FFC6", fontWeight: 600, textDecoration: "none", opacity: 1 }}>About</a>
          </div>
        </div>
      </div>
    </main>
  );
}
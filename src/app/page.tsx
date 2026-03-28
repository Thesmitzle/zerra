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

const PACKAGES = [
  { name: "Trial", duration: "7 days", price: "2€", btc: "~0.000020 BTC", popular: false },
  { name: "Monthly", duration: "1 month", price: "7€", btc: "~0.000070 BTC", popular: true },
  { name: "Quarterly", duration: "3 months", price: "15€", btc: "~0.000150 BTC", popular: false },
];

const BTC_ADDRESS = "bc1qwx9mh5mncvawx6v6veuqvfvrehx3eu8p8v3kau";

function PaymentModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(1);

  function copyAddress() {
    navigator.clipboard.writeText(BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(11,11,15,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "rgba(18,18,26,0.98)", border: "1px solid rgba(0,255,198,0.2)", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "380px", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>Get Access</p>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#E5E7EB", margin: 0, fontFamily: "var(--font-syne)" }}>Choose a Plan</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", color: "#9CA3AF", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Packages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg.name}
              onClick={() => setSelectedPkg(i)}
              style={{ background: selectedPkg === i ? "rgba(0,255,198,0.08)" : "rgba(26,26,38,0.9)", border: `1px solid ${selectedPkg === i ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", padding: "12px 14px", cursor: "pointer", position: "relative", transition: "all 0.15s" }}
            >
              {pkg.popular && (
                <span style={{ position: "absolute", top: "-10px", right: "12px", background: "#00FFC6", color: "#0B0B0F", fontSize: "9px", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.05em" }}>POPULAR</span>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: selectedPkg === i ? "#00FFC6" : "#E5E7EB", margin: "0 0 2px" }}>{pkg.name}</p>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>{pkg.duration}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "16px", fontWeight: 800, color: selectedPkg === i ? "#00FFC6" : "#E5E7EB", margin: "0 0 2px" }}>{pkg.price}</p>
                  <p style={{ fontSize: "10px", color: "#9CA3AF", margin: 0, fontFamily: "monospace" }}>{pkg.btc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BTC Address */}
        <div style={{ background: "rgba(26,26,38,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>₿ Send Bitcoin to</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p style={{ fontSize: "10px", color: "#00FFC6", fontFamily: "monospace", margin: 0, flex: 1, wordBreak: "break-all", lineHeight: 1.5 }}>{BTC_ADDRESS}</p>
            <button
              onClick={copyAddress}
              style={{ background: copied ? "rgba(0,255,198,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", color: copied ? "#00FFC6" : "#9CA3AF", whiteSpace: "nowrap", transition: "all 0.15s" }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background: "rgba(0,255,198,0.04)", border: "1px solid rgba(0,255,198,0.1)", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, lineHeight: 1.7 }}>
            1. Send <strong style={{ color: "#00FFC6" }}>{PACKAGES[selectedPkg].price}</strong> worth of BTC to the address above<br />
            2. Email your payment screenshot to:<br />
            <strong style={{ color: "#E5E7EB" }}>alphage3k@gmail.com</strong><br />
            3. Receive your access code within <strong style={{ color: "#00FFC6" }}>24 hours</strong>
          </p>
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.04)", color: "#9CA3AF", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", cursor: "pointer" }}
        >
          I already have a code
        </button>
      </div>
    </div>
  );
}

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
  const [showPayment, setShowPayment] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
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

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}

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
                type="password"
value={accessCode}
onChange={(e) => { setAccessCode(e.target.value); setCodeError(false); }}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                placeholder="Enter access code"
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
              style={{ width: "100%", padding: "12px", background: "#00FFC6", color: "#0B0B0F", fontSize: "13px", fontWeight: 800, border: "none", borderRadius: "12px", cursor: verifying ? "not-allowed" : "pointer", opacity: verifying || !accessCode.trim() ? 0.6 : 1, fontFamily: "var(--font-syne)", marginBottom: "10px" }}
            >
              {verifying ? "Verifying…" : "Enter Zerra"}
            </button>
            <button
              onClick={() => setShowPayment(true)}
              style={{ width: "100%", padding: "10px", background: "transparent", color: "#9CA3AF", fontSize: "12px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-outfit)" }}
            >
              Don't have a code? <span style={{ color: "#00FFC6" }}>Get Access →</span>
            </button>
          </div>
        ) : (
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
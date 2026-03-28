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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(11,11,15,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "rgba(18,18,26,0.98)", border: "1px solid rgba(0,255,198,0.2)", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "380px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>Get Access</p>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#E5E7EB", margin: 0, fontFamily: "var(--font-syne)" }}>Choose a Plan</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", color: "#9CA3AF", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {PACKAGES.map((pkg, i) => (
            <div key={pkg.name} onClick={() => setSelectedPkg(i)} style={{ background: selectedPkg === i ? "rgba(0,255,198,0.08)" : "rgba(26,26,38,0.9)", border: `1px solid ${selectedPkg === i ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", padding: "12px 14px", cursor: "pointer", position: "relative", transition: "all 0.15s" }}>
              {pkg.popular && <span style={{ position: "absolute", top: "-10px", right: "12px", background: "#00FFC6", color: "#0B0B0F", fontSize: "9px", fontWeight: 800, padding: "2px 8px", borderRadius: "20px" }}>POPULAR</span>}
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
        <div style={{ background: "rgba(26,26,38,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>₿ Send Bitcoin to</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p style={{ fontSize: "10px", color: "#00FFC6", fontFamily: "monospace", margin: 0, flex: 1, wordBreak: "break-all", lineHeight: 1.5 }}>{BTC_ADDRESS}</p>
            <button onClick={copyAddress} style={{ background: copied ? "rgba(0,255,198,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(0,255,198,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", color: copied ? "#00FFC6" : "#9CA3AF", whiteSpace: "nowrap", transition: "all 0.15s" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div style={{ background: "rgba(0,255,198,0.04)", border: "1px solid rgba(0,255,198,0.1)", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, lineHeight: 1.7 }}>
            1. Send <strong style={{ color: "#00FFC6" }}>{PACKAGES[selectedPkg].price}</strong> worth of BTC to the address above<br />
            2. Email your payment screenshot to:<br />
            <strong style={{ color: "#E5E7EB" }}>alphage3k@gmail.com</strong><br />
            3. Receive your access code within <strong style={{ color: "#00FFC6" }}>24 hours</strong>
          </p>
        </div>
        <button onClick={onClose} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.04)", color: "#9CA3AF", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", cursor: "pointer" }}>
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
  const [terminalText, setTerminalText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const terminalLines = [
    "Initializing secure tunnel...",
    "AES-256-GCM encryption ready.",
    "Zero-knowledge protocol active.",
    "Server blind mode: ON",
    "Awaiting access credentials_",
  ];

  useEffect(() => {
    if (sessionStorage.getItem("zerra_verified") === "true") setCodeVerified(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.12;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Terminal typewriter effect
  useEffect(() => {
    if (codeVerified) return;
    let lineIndex = 0;
    let charIndex = 0;
    let current = "";
    let timeout: NodeJS.Timeout;

    function type() {
      if (lineIndex >= terminalLines.length) {
        lineIndex = 0;
        charIndex = 0;
        current = "";
        timeout = setTimeout(type, 2000);
        return;
      }
      const line = terminalLines[lineIndex];
      if (charIndex < line.length) {
        current += line[charIndex];
        setTerminalText(current);
        charIndex++;
        timeout = setTimeout(type, 35);
      } else {
        timeout = setTimeout(() => {
          current += "\n";
          lineIndex++;
          charIndex = 0;
          type();
        }, 600);
      }
    }
    type();
    return () => clearTimeout(timeout);
  }, [codeVerified]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  function toggleMute() {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setMuted(prev => !prev);
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
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", position: "relative", overflow: "hidden", background: "#0B0B0F" }}>

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
      <audio ref={audioRef} src="/ambient.mp3" loop preload="auto" />

      {/* Mute */}
      <button onClick={toggleMute} style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 50, width: "36px", height: "36px", borderRadius: "50%", background: "rgba(18,18,26,0.9)", border: "1px solid rgba(0,255,198,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="23" y1="9" x2="17" y2="15" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#00FFC6" strokeWidth="1.5" strokeLinecap="round"/></svg>
        )}
      </button>

      {/* Pozadina — žena pomaknuta prema dolje */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <img alt="" src="/zerra-mascot.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 75%", filter: "brightness(0.22) saturate(0.7)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(11,11,15,0.6) 0%, rgba(11,11,15,0.2) 40%, rgba(11,11,15,0.75) 75%, rgba(11,11,15,1) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(0,255,198,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* Scanlines overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none" }} />

      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,255,198,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,198,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "420px" }}>


{/* Cyber tagline */}
{!codeVerified && (
  <div style={{ textAlign: "center", marginBottom: "12px" }}>
    <p style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(0,255,198,0.4)", letterSpacing: "0.06em", margin: 0, lineHeight: 1.6 }}>
      <span style={{ color: "rgba(0,255,198,0.2)" }}>{"///"}</span>{" "}
      If you&apos;re not paying, you are the product.{" "}
      <span style={{ color: "#00FFC6" }}>Here, you pay with crypto.</span>
    </p>
  </div>
)}
        {/* Access code gate */}
        {!codeVerified ? (
          <div style={{ background: "rgba(11,11,15,0.9)", border: "1px solid rgba(0,255,198,0.2)", borderRadius: "16px", overflow: "hidden", backdropFilter: "blur(20px)", marginBottom: "16px", boxShadow: "0 0 40px rgba(0,255,198,0.05), inset 0 0 40px rgba(0,255,198,0.02)" }}>

            {/* Terminal header bar */}
            <div style={{ background: "rgba(0,255,198,0.05)", borderBottom: "1px solid rgba(0,255,198,0.1)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00FFC6" }} />
              <span style={{ fontSize: "9px", color: "rgba(0,255,198,0.5)", fontFamily: "monospace", marginLeft: "8px", letterSpacing: "0.1em" }}>ZERRA://SECURE_AUTH</span>
            </div>

            {/* Terminal output */}
            <div style={{ padding: "12px 14px 0", fontFamily: "monospace", fontSize: "9px", color: "rgba(0,255,198,0.6)", lineHeight: 1.8, minHeight: "80px" }}>
              {terminalText.split("\n").map((line, i) => (
                <div key={i}>
                  {line && <span style={{ color: "rgba(0,255,198,0.35)" }}>{">"} </span>}
                  {line}
                  {i === terminalText.split("\n").length - 1 && (
                    <span style={{ opacity: cursorVisible ? 1 : 0, color: "#00FFC6" }}>█</span>
                  )}
                </div>
              ))}
            </div>

            {/* Input section */}
            <div style={{ padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "9px", color: "rgba(0,255,198,0.5)", fontFamily: "monospace" }}>ACCESS_CODE:</span>
              </div>
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => { setAccessCode(e.target.value); setCodeError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  placeholder="enter_access_code"
                  maxLength={20}
                  autoFocus
                  style={{ width: "100%", background: "rgba(0,255,198,0.03)", border: `1px solid ${codeError ? "#EF4444" : "rgba(0,255,198,0.15)"}`, borderRadius: "8px", padding: "10px 14px", color: "#00FFC6", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", letterSpacing: "0.15em", transition: "all 0.2s" }}
                />
              </div>
              {codeError && (
                <p style={{ fontSize: "10px", color: "#EF4444", marginBottom: "8px", fontFamily: "monospace" }}>
                  [ERROR] Invalid access code. Access denied.
                </p>
              )}
              <button
                onClick={verifyCode}
                disabled={verifying || !accessCode.trim()}
                style={{ width: "100%", padding: "11px", background: verifying ? "rgba(0,255,198,0.1)" : "#00FFC6", color: "#0B0B0F", fontSize: "12px", fontWeight: 800, border: "1px solid rgba(0,255,198,0.5)", borderRadius: "8px", cursor: verifying ? "not-allowed" : "pointer", opacity: !accessCode.trim() ? 0.4 : 1, fontFamily: "monospace", letterSpacing: "0.1em", transition: "all 0.2s", marginBottom: "8px" }}
              >
                {verifying ? "VERIFYING..." : "[ AUTHENTICATE ]"}
              </button>
              <button
                onClick={() => setShowPayment(true)}
                style={{ width: "100%", padding: "9px", background: "transparent", color: "#9CA3AF", fontSize: "11px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", cursor: "pointer", fontFamily: "monospace" }}
              >
                No access? <span style={{ color: "#00FFC6" }}>GET_ACCESS →</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(11,11,15,0.9)", border: "1px solid rgba(0,255,198,0.2)", borderRadius: "16px", overflow: "hidden", backdropFilter: "blur(20px)", marginBottom: "16px", boxShadow: "0 0 40px rgba(0,255,198,0.05)" }}>
            <div style={{ background: "rgba(0,255,198,0.05)", borderBottom: "1px solid rgba(0,255,198,0.1)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00FFC6" }} />
              <span style={{ fontSize: "9px", color: "rgba(0,255,198,0.5)", fontFamily: "monospace", marginLeft: "8px", letterSpacing: "0.1em" }}>ZERRA://CREATE_ROOM</span>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "9px", color: "rgba(0,255,198,0.5)", fontFamily: "monospace", marginBottom: "6px", letterSpacing: "0.1em" }}>DISPLAY_NAME (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="anonymous"
                  maxLength={24}
                  style={{ width: "100%", background: "rgba(0,255,198,0.03)", border: "1px solid rgba(0,255,198,0.12)", borderRadius: "8px", padding: "10px 14px", color: "#E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "9px", color: "rgba(0,255,198,0.5)", fontFamily: "monospace", marginBottom: "6px", letterSpacing: "0.1em" }}>ROOM_TTL</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      style={{ padding: "8px 4px", borderRadius: "8px", border: "1px solid", borderColor: expiry === opt.value ? "#00FFC6" : "rgba(0,255,198,0.1)", background: expiry === opt.value ? "rgba(0,255,198,0.12)" : "rgba(0,255,198,0.02)", color: expiry === opt.value ? "#00FFC6" : "#9CA3AF", cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontFamily: "monospace" }}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: "9px", opacity: 0.6, marginTop: "1px" }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createRoom}
                disabled={loading}
                style={{ width: "100%", padding: "12px", background: loading ? "rgba(0,255,198,0.1)" : "#00FFC6", color: "#0B0B0F", fontSize: "12px", fontWeight: 800, border: "1px solid rgba(0,255,198,0.5)", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "monospace", letterSpacing: "0.05em", boxShadow: loading ? "none" : "0 0 20px rgba(0,255,198,0.25)", transition: "all 0.2s" }}
              >
                {loading ? "GENERATING_KEY..." : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    INIT_ENCRYPTED_ROOM
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      
        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#9CA3AF", opacity: 0.45, fontFamily: "var(--font-outfit)" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#00FFC6", boxShadow: "0 0 6px rgba(0,255,198,0.8)", flexShrink: 0 }} />
            <span>Invite only · No accounts · No logs ·</span>
            <span style={{ color: "#E5E7EB", fontWeight: 600 }}>AlphaGe3k</span>
            <span>·</span>
            <a href="/zerra-about.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#00FFC6", fontWeight: 600, textDecoration: "none", opacity: 1 }}>About</a>
            <span>·</span>
            <a href="mailto:alphage3k@gmail.com" title="Contact" style={{ color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", opacity: 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/>
                <path d="M2 7l10 7 10-7" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0,255,198,0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(0,255,198,0.8)); }
        }
      `}</style>
    </main>
  );
}
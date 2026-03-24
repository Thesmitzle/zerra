"use client";

import { useState, useEffect } from "react";

interface WelcomeModalProps {
  onEnter: () => void;
}

export function WelcomeModal({ onEnter }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function handleEnter() {
    setLeaving(true);
    setTimeout(() => onEnter(), 380);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(11,11,15,0.95)", backdropFilter: "blur(16px)" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 35% 50%, rgba(0,255,198,0.07) 0%, transparent 55%)" }} />

      <div
        className={`relative w-full overflow-hidden transition-all duration-380 ${
          leaving ? "opacity-0 scale-95" : visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
        style={{
          maxWidth: "360px",
          background: "rgba(14,14,22,0.97)",
          border: "1px solid rgba(0,255,198,0.18)",
          borderRadius: "20px",
          boxShadow: "0 0 60px rgba(0,255,198,0.07), 0 32px 80px rgba(0,0,0,0.7)",
          transition: "opacity 0.38s ease, transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,198,0.55), transparent)" }} />

        {/* Image */}
        <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
          <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(14,14,22,0.6) 65%, rgba(14,14,22,1) 100%)" }} />
          
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "rgba(0,255,198,0.1)", border: "1px solid rgba(0,255,198,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" style={{ boxShadow: "0 0 6px rgba(0,255,198,0.9)" }} />
            <span className="text-accent font-semibold" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>End-to-end encrypted</span>
          </div>

          <img
            src="/zerra-mascot.png"
            alt="Zerra"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%", filter: "brightness(0.85) saturate(1.1)" }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "16px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#00FFC6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(0,255,198,0.3)" }}>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L16.5 5.25V12.75L9 16.5L1.5 12.75V5.25L9 1.5Z" stroke="#0B0B0F" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="2.5" fill="#0B0B0F"/>
              </svg>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.02em", fontFamily: "var(--font-syne)" }}>Zerra</span>
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1.15, margin: "0 0 4px", letterSpacing: "-0.02em", fontFamily: "var(--font-syne)" }}>
            <span style={{ color: "#E5E7EB" }}>Chat Freely.</span>
            <br />
            <span style={{ color: "#00FFC6", textShadow: "0 0 20px rgba(0,255,198,0.3)" }}>Zerra Knows Nothing.</span>
          </h1>

          <div style={{ width: "32px", height: "2px", background: "#00FFC6", borderRadius: "2px", margin: "10px 0", opacity: 0.55 }} />

          <p style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.6, margin: "0 0 16px", fontFamily: "var(--font-outfit)" }}>
            Fully encrypted conversations. Privacy guaranteed.{" "}
            <span style={{ color: "#E5E7EB", fontWeight: 500 }}>Zerra sees nothing. Your messages stay only yours.</span>
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "16px" }}>
            {[
              { icon: "🔑", label: "AES-256", sub: "Encryption" },
              { icon: "👁️", label: "Zero Log", sub: "Server blind" },
              { icon: "💣", label: "Self-Destruct", sub: "Auto-delete" },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center", borderRadius: "10px", padding: "8px 4px", background: "rgba(0,255,198,0.05)", border: "1px solid rgba(0,255,198,0.1)" }}>
                <div style={{ fontSize: "14px", marginBottom: "3px" }}>{item.icon}</div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "#E5E7EB" }}>{item.label}</div>
                <div style={{ fontSize: "8px", color: "#9CA3AF", marginTop: "1px" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleEnter}
            style={{ width: "100%", padding: "12px", background: "#00FFC6", color: "#0B0B0F", fontSize: "13px", fontWeight: 800, border: "none", borderRadius: "12px", cursor: "pointer", letterSpacing: "0.02em", boxShadow: "0 0 20px rgba(0,255,198,0.2)", fontFamily: "var(--font-syne)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#0B0B0F" strokeWidth="1.4"/>
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#0B0B0F" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Enter Secure Room
          </button>

          <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: "10px", color: "#9CA3AF", opacity: 0.5, fontFamily: "var(--font-outfit)" }}>
            No accounts · No logs · No traces
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,198,0.2), transparent)" }} />
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";

interface WelcomeModalProps {
  onEnter: () => void;
}

export function WelcomeModal({ onEnter }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  function handleEnter() {
    setLeaving(true);
    setTimeout(() => onEnter(), 380);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        background: "rgba(11,11,15,0.97)",
        backdropFilter: "blur(16px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,198,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,198,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {/* Scanlines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)", pointerEvents: "none" }} />
      {/* Radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 35% 50%, rgba(0,255,198,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Card */}
      <div
        style={{
          position: "relative", width: "100%", maxWidth: "360px",
          background: "rgba(11,11,15,0.95)",
          border: "1px solid rgba(0,255,198,0.2)",
          borderRadius: "16px",
          boxShadow: "0 0 60px rgba(0,255,198,0.06), 0 32px 80px rgba(0,0,0,0.8)",
          overflow: "hidden",
          opacity: leaving ? 0 : visible ? 1 : 0,
          transform: leaving ? "scale(0.95)" : visible ? "scale(1)" : "scale(0.90)",
          transition: "opacity 0.38s ease, transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
        }}
      >
        {/* Top line glow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,255,198,0.6), transparent)", zIndex: 2 }} />

        {/* Terminal header */}
        <div style={{ background: "rgba(0,255,198,0.05)", borderBottom: "1px solid rgba(0,255,198,0.1)", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00FFC6" }} />
          <span style={{ fontSize: "9px", color: "rgba(0,255,198,0.5)", fontFamily: "monospace", marginLeft: "8px", letterSpacing: "0.1em" }}>ZERRA://SECURE_ROOM</span>
          <span style={{ marginLeft: "auto", fontSize: "9px", color: "rgba(0,255,198,0.35)", fontFamily: "monospace" }}>
            AES-256-GCM{" "}
            <span style={{ opacity: cursorVisible ? 1 : 0, color: "#00FFC6" }}>█</span>
          </span>
        </div>

        {/* Mascot image */}
        <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, transparent 20%, rgba(11,11,15,0.5) 65%, rgba(11,11,15,1) 100%)" }} />
          {/* Scanline over image */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)", pointerEvents: "none" }} />
          <img
            src="/zerra-mascot.png"
            alt="Zerra"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%", filter: "brightness(0.75) saturate(0.9)" }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "14px 20px 20px" }}>

          {/* Terminal headline */}
          <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,255,198,0.6)", marginBottom: "14px", lineHeight: 1.9 }}>
            <span style={{ color: "rgba(0,255,198,0.3)" }}>&gt;</span> Initializing secure tunnel...<br />
            <span style={{ color: "rgba(0,255,198,0.3)" }}>&gt;</span> Zero-knowledge protocol: <span style={{ color: "#00FFC6" }}>ACTIVE</span><br />
            <span style={{ color: "rgba(0,255,198,0.3)" }}>&gt;</span> Server blind mode: <span style={{ color: "#00FFC6" }}>ON</span><br />
            <span style={{ color: "rgba(0,255,198,0.3)" }}>&gt;</span> <span style={{ color: "#E5E7EB", fontWeight: 700 }}>chat_freely</span><span style={{ color: "rgba(0,255,198,0.4)" }}>.</span><span style={{ color: "#00FFC6", fontWeight: 700, textShadow: "0 0 12px rgba(0,255,198,0.6)" }}>zerra_knows_nothing</span>
          </div>

          {/* Trust pills — cyber style */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "16px" }}>
            {[
              { icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#00FFC6" strokeWidth="1.3"/>
                  <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#00FFC6" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ), label: "AES-256", sub: "Encryption" },
              { icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <ellipse cx="7" cy="7" rx="5.5" ry="3.5" stroke="#00FFC6" strokeWidth="1.3"/>
                  <circle cx="7" cy="7" r="1.5" fill="#00FFC6"/>
                  <path d="M1.5 7h1M11.5 7h1" stroke="#00FFC6" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ), label: "Zero Log", sub: "Server blind" },
              { icon: (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5L12 4v4c0 2.5-2 4.5-5 5-3-0.5-5-2.5-5-5V4L7 1.5z" stroke="#00FFC6" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M4.5 7l1.5 1.5 3-3" stroke="#00FFC6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ), label: "Self-Destruct", sub: "Auto-delete" },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center", borderRadius: "8px", padding: "8px 4px", background: "rgba(0,255,198,0.04)", border: "1px solid rgba(0,255,198,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>{item.icon}</div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#E5E7EB", fontFamily: "monospace", letterSpacing: "0.04em" }}>{item.label}</div>
                <div style={{ fontSize: "8px", color: "rgba(156,163,175,0.6)", marginTop: "1px", fontFamily: "monospace" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleEnter}
            style={{
              width: "100%", padding: "12px",
              background: "#00FFC6", color: "#0B0B0F",
              fontSize: "12px", fontWeight: 800,
              border: "1px solid rgba(0,255,198,0.5)",
              borderRadius: "8px", cursor: "pointer",
              letterSpacing: "0.1em",
              fontFamily: "monospace",
              boxShadow: "0 0 20px rgba(0,255,198,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "all 0.2s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#0B0B0F" strokeWidth="1.4"/>
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#0B0B0F" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            [ INIT_SECURE_ROOM ]
          </button>

          {/* Fine print */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <p style={{ margin: 0, fontSize: "9px", color: "rgba(0,255,198,0.2)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
              <span style={{ color: "rgba(0,255,198,0.15)" }}>//</span> no_accounts · no_logs · no_traces
            </p>
          </div>
        </div>

        {/* Bottom line glow */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,255,198,0.2), transparent)" }} />
      </div>
    </div>
  );
}

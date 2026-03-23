"use client";

import { useState, useEffect } from "react";

interface WelcomeModalProps {
  onEnter: () => void;
}

export function WelcomeModal({ onEnter }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function handleEnter() {
    setLeaving(true);
    setTimeout(() => {
      onEnter();
    }, 380);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "rgba(11,11,15,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 35% 50%, rgba(0,255,198,0.07) 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, rgba(59,130,246,0.06) 0%, transparent 50%)",
        }}
      />
      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Modal card */}
      <div
        className={`relative w-full max-w-md overflow-hidden transition-all duration-380 ${
          leaving
            ? "opacity-0 scale-95 translate-y-2"
            : visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-6"
        }`}
        style={{
          background: "rgba(14,14,22,0.97)",
          border: "1px solid rgba(0,255,198,0.18)",
          borderRadius: "20px",
          boxShadow:
            "0 0 0 1px rgba(0,255,198,0.04) inset, 0 0 60px rgba(0,255,198,0.07), 0 32px 80px rgba(0,0,0,0.7)",
          transition: "opacity 0.38s cubic-bezier(0.4,0,0.2,1), transform 0.38s cubic-bezier(0.34,1.3,0.64,1)",
        }}
      >
        {/* Top shine line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,255,198,0.55) 50%, transparent 100%)",
          }}
        />

        {/* ── Mascot image ───────────────────────────────── */}
        <div className="relative h-64 overflow-hidden">
          {/* Fade overlay */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, rgba(14,14,22,0.7) 70%, rgba(14,14,22,1) 100%)",
            }}
          />

          {/* E2E badge over image */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(0,255,198,0.1)",
              border: "1px solid rgba(0,255,198,0.25)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"
              style={{
                boxShadow: "0 0 6px rgba(0,255,198,0.9)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span
              className="text-accent text-xs font-semibold tracking-widest uppercase"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              End-to-end encrypted
            </span>
          </div>

          {/* Mascot */}
          <img
            src="/zerra-mascot.png"
            alt="Zerra — privacy guardian"
            className="w-full h-full object-cover object-top relative z-0"
            style={{ filter: "brightness(0.82) saturate(1.1)" }}
          />
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div className="px-8 pb-8 pt-1">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#00FFC6",
                boxShadow: "0 0 16px rgba(0,255,198,0.3)",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
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
              className="text-xl font-extrabold text-text-primary tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Zerra
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-3xl font-extrabold leading-tight mb-1"
            style={{ fontFamily: "var(--font-syne)", letterSpacing: "-0.03em" }}
          >
            <span className="text-text-primary">Chat Freely.</span>
            <br />
            <span className="text-accent" style={{ textShadow: "0 0 24px rgba(0,255,198,0.35)" }}>
              Zerra Knows Nothing.
            </span>
          </h1>

          {/* Accent divider */}
          <div
            className="my-4 rounded-full"
            style={{
              width: "38px",
              height: "2px",
              background: "#00FFC6",
              opacity: 0.55,
            }}
          />

          {/* Body text */}
          <p
            className="text-sm text-text-muted leading-relaxed mb-6"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Your conversations, your secrets — fully encrypted. With Zerra,
            privacy is not optional, it&apos;s guaranteed.{" "}
            <span className="text-text-primary font-medium">
              Zerra sees nothing. Your messages stay only yours.
            </span>
          </p>

          {/* Trust pills */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: "🔑", label: "AES-256", sub: "Encryption" },
              { icon: "👁️", label: "Zero Log", sub: "Server blind" },
              { icon: "💣", label: "Self-Destruct", sub: "Auto-delete" },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center rounded-xl py-2.5"
                style={{
                  background: "rgba(0,255,198,0.05)",
                  border: "1px solid rgba(0,255,198,0.1)",
                }}
              >
                <div className="text-base mb-1">{item.icon}</div>
                <div
                  className="text-xs font-semibold text-text-primary"
                  style={{ fontSize: "10px" }}
                >
                  {item.label}
                </div>
                <div className="text-text-muted" style={{ fontSize: "9px", marginTop: "1px" }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={handleEnter}
            className="btn-press w-full py-3.5 rounded-xl font-extrabold text-bg text-sm tracking-wide transition-all duration-150 flex items-center justify-center gap-2"
            style={{
              background: "#00FFC6",
              fontFamily: "var(--font-syne)",
              boxShadow: "0 0 24px rgba(0,255,198,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 0 40px rgba(0,255,198,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 0 24px rgba(0,255,198,0.2)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#0B0B0F" strokeWidth="1.4" />
              <path
                d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"
                stroke="#0B0B0F"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            Enter Secure Room
          </button>

          {/* Fine print */}
          <p
            className="text-center text-text-muted mt-3"
            style={{
              fontSize: "11px",
              opacity: 0.5,
              fontFamily: "var(--font-outfit)",
            }}
          >
            No accounts · No logs · No traces
          </p>
        </div>

        {/* Bottom shine line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,255,198,0.2) 50%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { SELF_DESTRUCT_OPTIONS } from "@/types";

interface MessageInputProps {
  onSend: (text: string, selfDestructMs: number) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Type a message…",
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [selfDestructMs, setSelfDestructMs] = useState(0);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleTextChange(val: string) {
    setText(val);

    // Typing indicator
    if (val.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 1500);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, selfDestructMs);
    setText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTypingRef.current = false;
    onTyping(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const selectedOption = SELF_DESTRUCT_OPTIONS.find(
    (o) => o.value === selfDestructMs
  );

  return (
    <div className="glass border-t border-border px-4 py-3 sticky bottom-0 z-20">
      <div className="max-w-3xl mx-auto">
        {/* Self-destruct timer bar */}
        {selfDestructMs > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.5A4.5 4.5 0 1 0 10.5 6"
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path d="M6 4V6l1.5 1.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-red-400">
              Messages will self-destruct after{" "}
              <strong>{selectedOption?.label}</strong>
            </span>
            <button
              onClick={() => setSelfDestructMs(0)}
              className="ml-auto text-xs text-text-muted hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2">
          {/* Self-destruct button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className={`btn-press w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-150 ${
                selfDestructMs > 0
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : "border-border bg-surface-2 text-text-muted hover:text-text-primary hover:border-white/10"
              }`}
              title="Self-destruct timer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 6v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M6 2h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M8 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>

            {/* Timer dropdown */}
            {showTimerMenu && (
              <div className="absolute bottom-12 left-0 glass border border-border rounded-xl overflow-hidden z-30 min-w-[140px] shadow-xl">
                {SELF_DESTRUCT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelfDestructMs(opt.value);
                      setShowTimerMenu(false);
                    }}
                    className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${
                      selfDestructMs === opt.value
                        ? "text-accent bg-accent/10"
                        : "text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {opt.value === 0 ? (
                        <span className="opacity-50">∞</span>
                      ) : (
                        <span className="text-red-400 text-xs">💣</span>
                      )}
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="zerra-input w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder-text-muted text-sm resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              style={{
                fontFamily: "var(--font-outfit)",
                minHeight: "42px",
                maxHeight: "120px",
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className="btn-press flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-bg transition-all duration-150 hover:shadow-glow disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send message (Enter)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 8L2 2l3 6-3 6 12-6z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-text-muted/40 mt-2">
          End-to-end encrypted · Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

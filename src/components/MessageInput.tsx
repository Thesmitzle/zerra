"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { SELF_DESTRUCT_OPTIONS } from "@/types";
import { encryptFile } from "@/lib/crypto";

interface ReplyTo {
  id: string;
  senderName: string;
  plaintext: string;
}

interface MessageInputProps {
  onSend: (text: string, selfDestructMs: number, replyTo?: ReplyTo) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
}

const TRENDING_EMOJIS = [
  "😂", "❤️", "🔥", "👍", "😍", "🥺", "😭", "✨",
  "🙏", "💀", "😎", "🤣", "💯", "🫡", "👀", "😅",
  "🤝", "💪", "🎉", "😱", "🫶", "🤯", "💬", "🔐",
  "👻", "🕵️", "🤫", "🫠", "💣", "⚡", "🌙", "🦋",
];

export function MessageInput({
  onSend, onSendFile, onTyping, disabled = false,
  placeholder = "Type a message…", replyTo, onCancelReply,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [selfDestructMs, setSelfDestructMs] = useState(0);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#emoji-picker") && !target.closest("#emoji-btn")) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleTextChange(val: string) {
    setText(val);
    if (val.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 1500);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, selfDestructMs, replyTo || undefined);
    setText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTypingRef.current = false;
    onTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      if (replyTo) onCancelReply?.();
      setShowEmojiPicker(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }
    onSendFile(file);
    e.target.value = "";
  }

  useEffect(() => {
    return () => { if (typingTimeout.current) clearTimeout(typingTimeout.current); };
  }, []);

  const selectedOption = SELF_DESTRUCT_OPTIONS.find((o) => o.value === selfDestructMs);

  return (
    <div className="glass border-t border-border px-4 py-3 sticky bottom-0 z-20">
      <div className="max-w-3xl mx-auto">

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg,.gif,.webp"
          style={{ display: "none" }}
        />

        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 px-1 py-1.5 rounded-xl bg-surface-2 border border-accent/20">
            <div className="w-0.5 h-8 rounded-full bg-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-accent mb-0.5">{replyTo.senderName}</p>
              <p className="text-xs text-text-muted truncate">{replyTo.plaintext}</p>
            </div>
            <button
              onClick={onCancelReply}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Self-destruct bar */}
        {selfDestructMs > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1.5A4.5 4.5 0 1 0 10.5 6" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M6 4V6l1.5 1.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-red-400">
              Self-destruct after <strong>{selectedOption?.label}</strong>
            </span>
            <button onClick={() => setSelfDestructMs(0)} className="ml-auto text-xs text-text-muted hover:text-red-400 transition-colors">
              Remove
            </button>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2">

          {/* File attach button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="btn-press w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-surface-2 text-text-muted hover:text-accent hover:border-accent/30 transition-all duration-150 disabled:opacity-30"
              title="Attach file"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L8.5 2.5C9.4 1.6 10.9 1.6 11.8 2.5C12.7 3.4 12.7 4.9 11.8 5.8L5.8 11.8C5.4 12.2 4.6 12.2 4.2 11.8C3.8 11.4 3.8 10.6 4.2 10.2L9.5 4.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Emoji button */}
          <div className="relative flex-shrink-0">
            <button
              id="emoji-btn"
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowTimerMenu(false); }}
              className={`btn-press w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-150 ${showEmojiPicker ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface-2 text-text-muted hover:text-text-primary"}`}
              title="Emoji"
            >
              <span style={{ fontSize: "16px" }}>😊</span>
            </button>

            {showEmojiPicker && (
              <div
                id="emoji-picker"
                className="absolute glass border border-border rounded-2xl p-3 z-30 shadow-xl"
style={{ width: "220px", bottom: "48px", left: 0, maxHeight: "280px", overflowY: "auto" }}
              >
                <p className="text-xs text-text-muted mb-2 px-1" style={{ fontFamily: "var(--font-outfit)" }}>
                  Trending
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "2px" }}>
                  {TRENDING_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { insertEmoji(emoji); setShowEmojiPicker(false); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-2 transition-colors"
                      style={{ fontSize: "16px" }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timer button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setShowTimerMenu(!showTimerMenu); setShowEmojiPicker(false); }}
              className={`btn-press w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-150 ${selfDestructMs > 0 ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-border bg-surface-2 text-text-muted hover:text-text-primary"}`}
              title="Self-destruct timer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 6v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M6 2h4M8 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {showTimerMenu && (
              <div className="absolute bottom-12 left-0 glass border border-border rounded-xl overflow-hidden z-30 min-w-[140px] shadow-xl">
                {SELF_DESTRUCT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelfDestructMs(opt.value); setShowTimerMenu(false); }}
                    className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${selfDestructMs === opt.value ? "text-accent bg-accent/10" : "text-text-primary hover:bg-surface-2"}`}
                  >
                    <span className="flex items-center gap-2">
                      {opt.value === 0 ? <span className="opacity-50">∞</span> : <span className="text-red-400 text-xs">💣</span>}
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Textarea */}
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
              style={{ fontFamily: "var(--font-outfit)", minHeight: "42px", maxHeight: "120px" }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className="btn-press flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-bg transition-all duration-150 hover:shadow-glow disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <p className="text-center text-[10px] text-text-muted/40 mt-2">
          End-to-end encrypted · Max 5MB · Enter to send · Esc to cancel reply
        </p>
      </div>
    </div>
  );
}
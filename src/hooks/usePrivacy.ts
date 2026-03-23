"use client";
import { useEffect } from "react";

export function usePrivacy(displayName: string) {
  useEffect(() => {
    const handleVisibility = () => {
      const chat = document.getElementById("chat-messages");
      if (!chat) return;
      if (document.hidden) {
        chat.style.filter = "blur(12px)";
        chat.style.transition = "filter 0.3s ease";
      } else {
        chat.style.filter = "none";
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!displayName) return;
    const style = document.createElement("style");
    style.id = "watermark-style";
    style.textContent = `
      #chat-messages::before {
        content: "${displayName} • ZERRA PRIVATE";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-35deg);
        font-size: 18px;
        color: rgba(0, 255, 198, 0.04);
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
        letter-spacing: 0.2em;
        font-weight: 800;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById("watermark-style")?.remove();
    };
  }, [displayName]);
}
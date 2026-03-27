/**
 * Zerra Crypto — Zero-Knowledge End-to-End Encryption
 *
 * Uses the Web Crypto API (AES-GCM 256-bit).
 * The server NEVER receives plaintext or the encryption key.
 * The key lives ONLY in the URL fragment (#key=...) — never sent to the server.
 *
 * Flow:
 *   1. Room creator generates a random AES-GCM key
 *   2. Key is exported as base64 and placed in the URL fragment
 *   3. Recipient gets the key from the fragment (browser never sends # to server)
 *   4. Both parties encrypt/decrypt locally
 */

// ── Key generation ──────────────────────────────────────────────────────────

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,   // extractable
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

export async function importKeyFromBase64(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64);
  return crypto.subtle.importKey(
    "raw",
    raw.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,  // not extractable after import
    ["encrypt", "decrypt"]
  );
}

// ── Encrypt / Decrypt ────────────────────────────────────────────────────────

export interface EncryptedPayload {
  encryptedData: string; // base64
  iv: string;            // base64
}

export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    data.buffer as ArrayBuffer
  );

  return {
    encryptedData: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

export async function decryptMessage(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const encrypted = base64ToBuffer(payload.encryptedData);
  const iv = base64ToBuffer(payload.iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encrypted.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ── URL Fragment key management ──────────────────────────────────────────────

export function getKeyFromFragment(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const match = hash.match(/[#&]key=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildRoomUrl(roomId: string, keyBase64: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/room/${roomId}#key=${encodeURIComponent(keyBase64)}`;
}

// ── Buffer helpers ───────────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Fingerprint (visual key verification) ────────────────────────────────────

/**
 * Generates a short human-readable fingerprint from the key bytes.
 * Users can compare fingerprints out-of-band to verify key integrity.
 */
export async function generateKeyFingerprint(keyBase64: string): Promise<string> {
  const buffer = base64ToBuffer(keyBase64);
  const hash = await crypto.subtle.digest("SHA-256", buffer.buffer as ArrayBuffer);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Return first 16 chars in groups of 4
  return hex.slice(0, 16).match(/.{4}/g)!.join("-").toUpperCase();
// ── File encryption ──────────────────────────────────────────────────────────
export async function encryptFile(file: File, key: CryptoKey): Promise<{ encryptedData: ArrayBuffer; iv: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    arrayBuffer
  );
  return {
    encryptedData,
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptFile(encryptedData: ArrayBuffer, ivBase64: string, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);
}

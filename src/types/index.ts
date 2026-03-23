export interface EncryptedMessage {
  id: string;
  encryptedData: string; // base64 AES-GCM ciphertext
  iv: string;            // base64 IV
  selfDestructMs: number;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface DecryptedMessage extends EncryptedMessage {
  plaintext: string;
  isOwn: boolean;
  destructAt?: number;   // timestamp when message should disappear
  destroyed?: boolean;
}

export type SelfDestructOption = {
  label: string;
  value: number; // ms, 0 = no self-destruct
};

export const SELF_DESTRUCT_OPTIONS: SelfDestructOption[] = [
  { label: "Never", value: 0 },
  { label: "10 sec", value: 10_000 },
  { label: "1 min", value: 60_000 },
  { label: "5 min", value: 5 * 60_000 },
  { label: "1 hour", value: 60 * 60_000 },
];

export type RoomExpiry = "1h" | "24h" | "7d";

export interface RoomMeta {
  roomId: string;
  expiresAt: number;
  participantCount: number;
}

export interface TypingState {
  name: string;
  isTyping: boolean;
}
